from flask import Flask, render_template, request

app = Flask(__name__)

# 메인
@app.route('/')
def home():
    return render_template('index.html')

# 폼 입력 처리
@app.route('/submit', methods=['POST'])
def submit():
    name = request.form.get('name')
    return f"<h2>안녕하세요, {name}님!</h2>"

if __name__ == '__main__':
    app.run(debug=True)
