from langchain.chains import RetrievalQA
from flask_cors import CORS  # Import CORS
from langchain.document_loaders.csv_loader import CSVLoader
from langchain.embeddings import HuggingFaceBgeEmbeddings
from langchain.vectorstores import FAISS
from flask import Flask, request, jsonify
import openai
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration
vectordb_file_path = "faiss_index"
DATASET_CSV_FILE = 'Dataset/dataset.csv'

app = Flask(__name__)
CORS(app)
openai.api_key = os.getenv('OPENAI_API_KEY')

# Compute embeddings
instructor_embeddings = HuggingFaceBgeEmbeddings(model_name="hkunlp/instructor-large")

# Check if the FAISS index file exists
if os.path.exists(vectordb_file_path):
    # Load the existing FAISS index
    vectordb = FAISS.load_local(vectordb_file_path, instructor_embeddings, allow_dangerous_deserialization=True)
else:
    # Load the dataset
    loader = CSVLoader(file_path=DATASET_CSV_FILE, source_column="Question")
    data = loader.load()

    # Create a new FAISS vector database
    vectordb = FAISS.from_documents(documents=data, embedding=instructor_embeddings)

    # Save the FAISS index to disk
    vectordb.save_local(vectordb_file_path)

# Initialize the retriever
retriever = vectordb.as_retriever(score_threshold=0.7)


# @dsec This code is going to answer to user query based on the context given
@app.route('/get-answer', methods=['POST'])
def answer_question_based_on_context():
    data = request.json  # Assumes the question is sent as JSON
    question = data.get('question')
    
    if not question:
        return jsonify({"error": "Missing question"}), 400

    try:
        # Retrieve documents based on the question
        retrieved_documents = retriever.get_relevant_documents(question)
        
        # Assuming the top document contains the context you want to use
        if retrieved_documents:
            context = str(retrieved_documents[0])
            # Generate an answer with OpenAI API using the retrieved context
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": """Given the following context and a question, generate an answer based on this context only. In the answer try to provide as much text as possible from "Answer" section in the source document context without making much changes. If the answer is not found in the context, kindly state "I don't know." Don't try to make up an answer."""},
                    {"role": "user", "content": f"Context: {context}\nQuestion: {question}"}
                ],
                temperature=1,
                max_tokens=150,
                top_p=1.0,
                frequency_penalty=0.0,
                presence_penalty=0.0
            )

            if response.choices:
                last_choice = response.choices[-1]
                answer = last_choice.message['content'].strip()
                return jsonify({"answer": answer})
        else:
            return jsonify({"answer": "No relevant context found for the given question."})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5005)  