# modules/llm_handler.py
import os
import config
import regex as re
import google.generativeai as genai
from modules.web_search import search_for_example_answers

# Initialize the Gemini client
genai.configure(api_key="AIzaSyAWF4TvMZMEv7W-MTkNdZzTel324MwrZaE")
MODEL = genai.GenerativeModel('gemini-pro')

def generate_question(interview_type, document_text):
    prompt = f"As an expert {interview_type} interviewer, ask one relevant, open-ended question based on this document:\n\n---\n{document_text}\n---"
    try:
        response = MODEL.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error generating question from API: {e}"

def evaluate_answer(question, answer):
    # This new prompt demands a much higher level of detail
    prompt = f"""
    You are a meticulous and insightful interview coach. Your task is to provide a highly detailed evaluation of a candidate's answer.

    **INTERVIEW QUESTION:**
    "{question}"
    ---
    **CANDIDATE'S ANSWER:**
    "{answer}"
    ---
    **YOUR TASK:**
    Provide a detailed, multi-part evaluation. You MUST include scores and written analysis for each section.

    **1. Score Breakdown (Format: `Category: [SCORE]/10`)**
    You must provide a score for each of the following:
    - Factual Accuracy: [SCORE]/10
    - Relevance & Directness: [SCORE]/10
    - Structure & Clarity (STAR Method): [SCORE]/10

    **2. Detailed Written Evaluation**
    - **Strengths:** What did the candidate do well? (e.g., "Good use of a specific example...")
    - **Areas for Improvement:** What were the key weaknesses? (e.g., "The result of the action was unclear...")

    **3. Concrete Suggestion**
    - **Example Rephrasing:** Provide a short example of how they could have phrased a key part of their answer more effectively.
    """
    try:
        response = MODEL.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"An error occurred during evaluation: {e}"

def parse_scores_from_evaluation(evaluation_text: str) -> dict:
    scores = {
        'Factual Accuracy': 0,
        'Relevance & Directness': 0,
        'Structure & Clarity (STAR Method)': 0
    }
    # Updated regex to match the new category name
    pattern = r"(Factual Accuracy|Relevance & Directness|Structure & Clarity \(STAR Method\)):\s*\[?(\d{1,2})\]?\/10"
    matches = re.findall(pattern, evaluation_text, re.IGNORECASE)
    
    for match in matches:
        category_name, score_value = match[0].strip(), int(match[1])
        # Normalize the key for consistency
        if "Structure" in category_name:
            scores['Structure & Clarity (STAR Method)'] = score_value
        elif category_name in scores:
            scores[category_name] = score_value
            
    print(f"📊 Parsed scores: {scores}")
    return scores

def generate_holistic_feedback(full_interview_log):
    # This prompt is also enhanced for more detail
    prompt = f"""
    You are a senior career strategist reviewing a candidate's full interview performance.
    Based on the entire Q&A log, provide a detailed "Overall Performance Summary" and an "Actionable Improvement Plan".

    **FULL INTERVIEW LOG:**
    ---
    {full_interview_log}
    ---
    **YOUR TASK:**
    1.  **Overall Performance Summary:** Write a detailed paragraph summarizing the candidate's performance. Analyze their communication style, confidence, and consistency. Identify the most significant recurring strengths and weaknesses across all answers.
    2.  **Actionable Improvement Plan:** Provide a bulleted list of the top 3 most critical and specific actions the candidate must take. For each action, explain *why* it's important and provide a *concrete example*. (e.g., "- Action: Quantify your achievements. Why: It demonstrates impact. Example: Instead of 'improved the system,' say 'reduced server response time by 15%.'").
    """
    try:
        response = MODEL.generate_content(prompt)
        return response.text
    except Exception as e:
        return "Could not generate holistic feedback due to an error."