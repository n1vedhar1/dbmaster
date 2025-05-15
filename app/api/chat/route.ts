import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { Pool } from 'pg';

const {
    POSTGRES_CONNECTION_STRING,
    OPENAI_API_KEY,
} = process.env;

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

// Initialize PostgreSQL connection pool
const pool = new Pool({
    connectionString: POSTGRES_CONNECTION_STRING,
});

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();
        const lastMessage = messages[messages.length - 1]?.content;
        console.log('Received message:', lastMessage);
        let docContext: string = "";

        console.log('Generating embedding...');
        const embedding = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: lastMessage,
            encoding_format: "float",
        });
        console.log('Embedding generated, length:', embedding.data[0].embedding.length);

        let schemaContext: string = "";
        let sampleQueryContext: string = "";

        try {
            const client = await pool.connect();
            try {
                // Use cosine similarity to find the most relevant chunks from both tables
                const vectorString = `[${embedding.data[0].embedding.join(',')}]`;
                console.log('Vector string format:', vectorString.substring(0, 100) + '...');
                
                // Fetch schema context
                const schemaResult = await client.query(`
                    SELECT text
                    FROM schema_chunks
                    ORDER BY embedding <=> $1::vector
                    LIMIT 5
                `, [vectorString]);

                // Fetch sample query context
                const sampleQueryResult = await client.query(`
                    SELECT text
                    FROM query_chunks
                    ORDER BY embedding <=> $1::vector
                    LIMIT 2
                `, [vectorString]);

                console.log('Found relevant schema chunks:', schemaResult.rows.length);
                console.log('Found relevant sample query chunks:', sampleQueryResult.rows.length);

                if (schemaResult.rows.length > 0) {
                    const schemaArray: string[] = schemaResult.rows.map(row => row.text);
                    schemaContext = JSON.stringify(schemaArray);
                    console.log('Schema context length:', schemaContext.length);
                    console.log('Retrieved schema chunks: \n', schemaArray.slice(0, 10).join('\n'));
                }

                if (sampleQueryResult.rows.length > 0) {
                    const sampleQueryArray: string[] = sampleQueryResult.rows.map(row => row.text);
                    sampleQueryContext = JSON.stringify(sampleQueryArray);
                    console.log('Sample query context length:', sampleQueryContext.length);
                    console.log('Retrieved sample query chunks:', sampleQueryArray);
                }
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error in vector search:', error);
            schemaContext = "";
            sampleQueryContext = "";
        }

        const template = {
            role: "system",
            content: `You are an AI assistant who is an expert in writing and optimizing SQL queries specifically for PostgreSQL. Use the contexts below to understand the database schema, its relationships, and generate accurate and efficient SQL queries.
            -----------------------------------------
            SCHEMA CONTEXT:
            ${schemaContext}
            -----------------------------------------
            SAMPLE QUERY CONTEXT:
            ${sampleQueryContext}
            -----------------------------------------
            QUESTION: ${lastMessage}
            -----------------------------------------
            Schema Analysis Guidelines:
            Carefully examine all table definitions, column names, and data types.

            Pay special attention to primary keys and foreign keys to understand how tables relate to each other.

            Consider column constraints (e.g., NOT NULL, UNIQUE) and default values where relevant.

            Use naming conventions and key patterns to infer relationships when foreign keys are not explicitly declared.

            Understand many-to-one, one-to-many, and many-to-many relationships to construct precise JOIN conditions.

            Query Generation Guidelines:
            IMPORTANT: You must ONLY generate SELECT queries. Do not generate INSERT, UPDATE, DELETE, or any other type of query.
            
            Always use the exact table and column names as defined in the schema.

            Use efficient JOINs based on known or inferred relationships.

            Apply WHERE conditions to filter results precisely based on user requirements.

            Use proper SQL syntax, formatting, and indentation for readability.

            Optimize for PostgreSQL performance, using best practices such as:

            Preferring EXISTS over IN for correlated subqueries where appropriate.

            Avoiding unnecessary SELECT *; select only required columns.

            Using CTEs (WITH clauses) or window functions when needed.

            Leveraging LIMIT, OFFSET, or indexes if beneficial for large datasets.
            
            When writing SQL queries:
            1. Always check the schema to verify which table owns each column
            2. For joins, explicitly specify the table alias for each column (e.g., po.buyer_code, li.sku)
            3. When referencing columns from multiple tables, use table aliases to avoid ambiguity
            4. Verify foreign key relationships before writing joins
            5. Include table aliases in the FROM and JOIN clauses for clarity
            6. when searching, do a case insensitive search

            Target Database: PostgreSQL
            Output Format: IMPORTANT - Return ONLY the SELECT query without any explanation or additional text. The response must start with SELECT.
            Objective: Generate correct, efficient, and readable SELECT queries based on schema and user intent.
                        `
        };

        console.log('Generating SQL query...');
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [template, ...messages],
            stream: false,
        });

        const sqlQuery = response.choices[0].message.content;
        console.log('Generated SQL query:', sqlQuery);
        if (!sqlQuery) {
            throw new Error("No SQL query generated");
        }

        // Execute the SQL query
        try {
            console.log('Executing SQL query...');
            const result = await pool.query(sqlQuery);
            console.log('Query results:', {
                rowCount: result.rows.length,
                firstRow: result.rows[0]
            });
            
            const answerTemplate = {
                role: "system",
                content: `You are an AI assistant who transforms SQL query results into clear, professional, and easy-to-understand responses. Your role is to:

                1. Present the information in a structured and organized manner
                2. Use natural language that avoids technical database terminology
                3. Highlight key insights and patterns in the data
                4. Format numbers and dates appropriately for readability
                5. Provide context and explanations when needed
                6. Use bullet points or tables for better data presentation
                7. Summarize large datasets effectively

                Remember:
                - Focus on what the data means, not how it was retrieved
                - Use clear, concise language
                - Format the response for easy scanning and understanding
                - Add context to help users understand the significance of the results
                - If the results are empty or show no data, explain what this means in business terms

                The results are as follows:
                ${JSON.stringify(result.rows, null, 2)}
                query is as follows:
                ${sqlQuery}
                context is as follows:
                ${docContext}
                -----------------------------------------
`
            }

            console.log('Generating final response...');
            const answerResponse = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [answerTemplate, ...messages],
                stream: true,
            });

            const stream = OpenAIStream(answerResponse as any);
            return new StreamingTextResponse(stream);
        } catch (error) {
            console.error('Error executing SQL query:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error in chat API:', error);
        throw error;
    }
}