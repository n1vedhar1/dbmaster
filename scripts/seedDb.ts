import OpenAI from "openai";
import { Pool } from 'pg';
import fs from "fs";
import path from "path";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import "dotenv/config";

const {
  POSTGRES_CONNECTION_STRING,
  OPENAI_API_KEY,
} = process.env;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const pool = new Pool({
  connectionString: POSTGRES_CONNECTION_STRING,
});

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

// Create a separate splitter for queries that preserves query integrity
const querySplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
  separators: ["\n\n", "\n", " ", ""], // This ensures we don't split within queries
});

const createTable = async () => {
  const client = await pool.connect();
  try {
    // Drop the table if it exists and create it fresh with vector support
    await client.query(`
      DROP TABLE IF EXISTS schema_chunks;
      CREATE EXTENSION IF NOT EXISTS vector;
      CREATE TABLE schema_chunks (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        embedding vector(1536)
      );
    `);
    console.log('Schema chunks table created successfully');
    await client.query(`
      DROP TABLE IF EXISTS query_chunks;
      CREATE TABLE query_chunks (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        embedding vector(1536)
      );
    `);
    console.log('Query chunks table created successfully');
  } catch (error) {
    console.error('Error creating table:', error);
    throw error;
  } finally {
    client.release();
  }
};

const loadData = async () => {
  const client = await pool.connect();
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, "schema.json"), "utf8"));
    
    // Process each table as a single chunk
    for (const table of data.tables) {
      const tableString = JSON.stringify(table);
      
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: tableString,
        encoding_format: "float",
      });

      const vector = embedding.data[0].embedding;
      const vectorString = `[${vector.join(',')}]`;
      
      await client.query(
        'INSERT INTO schema_chunks (text, embedding) VALUES ($1, $2::vector)',
        [tableString, vectorString]
      );
      console.log('Inserted schema chunk for table:', table.name);
    }


    for (const relationship of data.relationships) {
      const relationshipString = JSON.stringify(relationship);

      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: relationshipString,
      });

      const vector = embedding.data[0].embedding;
      const vectorString = `[${vector.join(',')}]`;

      await client.query(
        'INSERT INTO schema_chunks (text, embedding) VALUES ($1, $2::vector)',
        [relationshipString, vectorString]
      );
      console.log(`Inserted schema chunk for relationship: ${relationship.from_table} -> ${relationship.to_table}`);
    }

    const queryData = JSON.parse(fs.readFileSync(path.join(__dirname, "sample_queries.json"), "utf8"));
    // Process each query individually to ensure they stay intact
    for (const query of queryData.queries) {
      const queryString = JSON.stringify(query);
      const chunks = await querySplitter.splitText(queryString);
      
      for (const chunk of chunks) {
        const embedding = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: chunk,
          encoding_format: "float",
        });

        const vector = embedding.data[0].embedding;
        const vectorString = `[${vector.join(',')}]`;

        await client.query(
          'INSERT INTO query_chunks (text, embedding) VALUES ($1, $2::vector)',
          [chunk, vectorString]
        );
        console.log('Inserted query chunk');
      }
    }
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  } finally {
    client.release();
  }
};

createTable().then(() => loadData());
