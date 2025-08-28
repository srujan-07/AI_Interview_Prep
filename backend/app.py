# app.py
import gradio as gr
import os
import time
import datetime
import random
import config
from modules.tts_handler import text_to_speech_file
from modules.stt_handler import transcribe_audio
from modules.doc_processor import extract_text_from_document
from modules.llm_handler import generate_question, evaluate_answer
from modules.report_generator import generate_pdf_report

def start_interview(interview_type, doc_file, name, num_questions):
    if not interview_type or not doc_file:
        return {
            chatbot: gr.update(value=[[None, "Please select an interview type and upload a document to begin."]]),
            audio_in: gr.update(interactive=False)
        }
    doc_text = extract_text_from_document(doc_file.name)
    if "Error" in doc_text or "Unsupported" in doc_text:
        return {
            chatbot: gr.update(value=[[None, f"Error: {doc_text}"]]),
            audio_in: gr.update(interactive=False)
        }
    initial_state = {
        "interview_type": interview_type,
        "doc_text": doc_text,
        "name": name if name else "User",
        "question_count": int(num_questions),
        "current_question_num": 1,
        "interview_log": [],
        "start_time": time.time()
    }
    first_question = generate_question(interview_type, doc_text)
    initial_state["current_question_text"] = first_question
    greeting = f"Hello {initial_state['name']}. We'll go through {int(num_questions)} questions today. Here is your first question:"
    tts_prompt = f"{greeting} {first_question}"
    ai_voice_path = text_to_speech_file(tts_prompt)
    return {
        state: initial_state,
        chatbot: gr.update(value=[[None, f"{greeting}\n\n{first_question}"]]),
        audio_out: gr.update(value=ai_voice_path, autoplay=True),
        audio_in: gr.update(interactive=True),
        start_btn: gr.update(interactive=False)
    }

def handle_interview_turn(user_audio, chatbot_history, current_state):
    user_answer_text = transcribe_audio(user_audio)
    chatbot_history.append([user_answer_text, None])
    yield {chatbot: chatbot_history, audio_in: gr.update(interactive=False)}
    
    evaluation_text = evaluate_answer(current_state["current_question_text"], user_answer_text)
    current_state["interview_log"].append({
        "question": current_state["current_question_text"],
        "answer": user_answer_text,
        "evaluation": evaluation_text
    })
    if current_state["current_question_num"] >= current_state["question_count"]:
        end_message = "This concludes the interview. Generating your final report now."
        chatbot_history.append([None, end_message])
        pdf_path = generate_pdf_file(current_state)
        ai_voice_path = text_to_speech_file(end_message)
        yield {
            chatbot: chatbot_history,
            audio_out: gr.update(value=ai_voice_path, autoplay=True),
            download_pdf_btn: gr.update(value=pdf_path, visible=True)
        }
    else:
        current_state["current_question_num"] += 1
        next_question = generate_question(current_state["interview_type"], current_state["doc_text"])
        current_state["current_question_text"] = next_question
        q_num = current_state["current_question_num"]
        transition_message = f"Thank you. Here is question {q_num}:\n\n{next_question}"
        chatbot_history.append([None, transition_message])
        ai_voice_path = text_to_speech_file(transition_message)
        yield {
            state: current_state,
            chatbot: chatbot_history,
            audio_out: gr.update(value=ai_voice_path, autoplay=True),
            audio_in: gr.update(interactive=True)
        }

def generate_pdf_file(state):
    total_duration_minutes = (time.time() - state.get("start_time", time.time())) / 60
    final_data = { 
        "name": state.get("name", "N/A"), 
        "type": state.get("interview_type", "N/A"), 
        "duration": total_duration_minutes,
        "q_and_a": state.get("interview_log", [])
    }
    file_name = f"Report_{state.get('name', 'User')}_{datetime.datetime.now().strftime('%Y-%m-%d')}.pdf"
    file_path = os.path.join(config.REPORT_FOLDER, file_name)
    generate_pdf_report(final_data, file_path)
    return file_path

with gr.Blocks(theme=gr.themes.Default()) as app:
    state = gr.State({})
    gr.Markdown("# PM Interview Coach")
    with gr.Row():
        with gr.Column(scale=1):
            gr.Markdown("### Setup")
            user_name = gr.Textbox(label="Your Name")
            interview_type_dd = gr.Dropdown(config.INTERVIEW_TYPES, label="Interview Type")
            num_questions_slider = gr.Slider(minimum=1, maximum=10, value=5, step=1, label="Number of Questions")
            
            # --- THIS IS THE UPDATED COMPONENT ---
            doc_uploader = gr.File(
                label="Upload Resume/CV (.pdf, .docx)",
                file_types=['.pdf', '.docx']
            )
            
            start_btn = gr.Button("Start Interview", variant="primary")
        
        with gr.Column(scale=2):
            chatbot = gr.Chatbot(label="Conversation", height=500)
            audio_in = gr.Audio(sources=["microphone"], type="filepath", label="Record Your Answer", interactive=False)
            download_pdf_btn = gr.File(label="Download Report", visible=False)
            audio_out = gr.Audio(visible=False, autoplay=True)

    start_btn.click(
        fn=start_interview,
        inputs=[interview_type_dd, doc_uploader, user_name, num_questions_slider],
        outputs=[state, chatbot, audio_out, audio_in, start_btn]
    )
    
    audio_in.stop_recording(
        fn=handle_interview_turn,
        inputs=[audio_in, chatbot, state],
        outputs=[state, chatbot, audio_out, audio_in, download_pdf_btn]
    )

if __name__ == "__main__":
    os.makedirs(config.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(config.REPORT_FOLDER, exist_ok=True)
    app.launch(debug=True)