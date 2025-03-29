from flask import Flask, render_template, request, redirect, send_file, send_from_directory, flash
from datetime import datetime
import os
import google.generativeai as genai

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))




# Initialize Flask
app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'wav'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Allow .wav files only
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_files():
    return sorted([f for f in os.listdir(UPLOAD_FOLDER) if allowed_file(f)], reverse=True)

# Analyze using Gemini API (transcribe + sentiment)
def analyze_audio_llm(file_path):
    model = genai.GenerativeModel("models/gemini-2.0-flash")  

    uploaded_file = genai.upload_file(file_path)

    prompt = """
Please transcribe the following audio and analyze its sentiment.
Respond in this format:

Text: <transcribed text>
Sentiment Analysis: Positive / Negative / Neutral
"""

    response = model.generate_content([
        prompt,
        uploaded_file
    ])

    return response.text

# Web Routes
@app.route('/')
def index():
    files = get_files()
    return render_template('index.html', files=files)

@app.route('/upload', methods=['POST'])
def upload_audio():
    if 'audio_data' not in request.files:
        flash('No audio data')
        return redirect(request.url)

    file = request.files['audio_data']
    if file.filename == '' or not allowed_file(file.filename):
        flash('Invalid file type')
        return redirect(request.url)

    filename = datetime.now().strftime("%Y%m%d-%I%M%S%p") + '.wav'
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    # Process via Gemini API
    result_text = analyze_audio_llm(file_path)

    # Save to .txt
    transcript_path = file_path + '.txt'
    with open(transcript_path, 'w') as f:
        f.write(result_text)

    return redirect('/')

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/upload/<filename>')
def get_file(filename):
    return send_file(os.path.join(app.config['UPLOAD_FOLDER'], filename))

@app.route('/script.js')
def scripts_js():
    return send_file('./script.js')

# Run
if __name__ == '__main__':
    app.run()
