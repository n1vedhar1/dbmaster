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

const createTable = async () => {
  const client = await pool.connect();
  try {
    // Create the table with vector support
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS vector;
      CREATE TABLE IF NOT EXISTS document_chunks (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        embedding vector(1536)
      );
    `);
    console.log('Table created successfully');
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
    const dataString = JSON.stringify(data, null, 2);
    const chunks = await splitter.splitText(dataString);
    
    for (const chunk of chunks) {
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
        encoding_format: "float",
      });

      const vector = embedding.data[0].embedding;
      
      // Convert the vector to a string representation that pgvector can understand
      const vectorString = `[${vector.join(',')}]`;
      
      await client.query(
        'INSERT INTO document_chunks (text, embedding) VALUES ($1, $2::vector)',
        [chunk, vectorString]
      );
      console.log('Inserted chunk');
    }
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  } finally {
    client.release();
  }
};

createTable().then(() => loadData());
