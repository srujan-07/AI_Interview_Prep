# modules/doc_processor.py

import fitz  # PyMuPDF for PDFs
import docx  # python-docx for DOCX files
import os

def extract_text_from_document(file_path):
    """
    Extracts text from a given document (PDF or DOCX).
    """
    text = ""
    try:
        _, file_extension = os.path.splitext(file_path)

        if file_extension.lower() == '.pdf':
            with fitz.open(file_path) as doc:
                for page in doc:
                    text += page.get_text()
        elif file_extension.lower() == '.docx':
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                text += para.text + "\n"
        else:
            return "Unsupported file format. Please upload a .pdf or .docx file."
    
    except Exception as e:
        return f"Error reading document: {e}"

    return text