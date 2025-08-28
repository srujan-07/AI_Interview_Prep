# api_server.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import config
from modules.doc_processor import extract_text_from_document
from modules.llm_handler import generate_question, evaluate_answer, generate_holistic_feedback

app = Flask(__name__)
CORS(app)  # Enable CORS for all domains

@app.route('/api/generate-question', methods=['POST'])
def api_generate_question():
    try:
        data = request.get_json()
        interview_type = data.get('interview_type', 'Technical')
        document_text = data.get('document_text', '')
        
        if not document_text:
            return jsonify({'error': 'Document text is required'}), 400
        
        question = generate_question(interview_type, document_text)
        
        return jsonify({
            'question': question,
            'interview_type': interview_type
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/evaluate-answer', methods=['POST'])
def api_evaluate_answer():
    try:
        data = request.get_json()
        question = data.get('question', '')
        answer = data.get('answer', '')
        
        if not question or not answer:
            return jsonify({'error': 'Both question and answer are required'}), 400
        
        evaluation = evaluate_answer(question, answer)
        
        return jsonify({
            'evaluation': evaluation,
            'question': question,
            'answer': answer
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/process-document', methods=['POST'])
def api_process_document():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save the file temporarily
        upload_folder = config.UPLOAD_FOLDER
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, file.filename)
        file.save(file_path)
        
        # Extract text from document
        document_text = extract_text_from_document(file_path)
        
        # Clean up the temporary file
        os.remove(file_path)
        
        if "Error" in document_text or "Unsupported" in document_text:
            return jsonify({'error': document_text}), 400
        
        return jsonify({
            'document_text': document_text,
            'filename': file.filename
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/holistic-feedback', methods=['POST'])
def api_holistic_feedback():
    try:
        data = request.get_json()
        interview_log = data.get('interview_log', '')
        
        if not interview_log:
            return jsonify({'error': 'Interview log is required'}), 400
        
        feedback = generate_holistic_feedback(interview_log)
        
        return jsonify({
            'feedback': feedback
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'AI Interview API is running'})

if __name__ == '__main__':
    # Ensure required directories exist
    os.makedirs(config.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(config.REPORT_FOLDER, exist_ok=True)
    
    # Run the Flask server
    app.run(host='0.0.0.0', port=5000, debug=False)
