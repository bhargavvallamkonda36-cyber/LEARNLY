import json
import os

from groq import Groq


# ============================================================
# GROQ
# ============================================================

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY is not configured"
    )


client = Groq(
    api_key=GROQ_API_KEY
)


MODEL = os.getenv(
    "GROQ_MODEL",
    "llama-3.3-70b-versatile",
)


# ============================================================
# SYSTEM PROMPT
# ============================================================

QUIZ_SYSTEM_PROMPT = """
You are Learnly AI Quiz Generator.

You create educational multiple-choice quizzes.

Rules:

1. Generate exactly the requested number of questions.
2. Questions must be based ONLY on the supplied course/module
   information.
3. Do not invent unrelated topics.
4. Each question must have exactly 4 options.
5. Options must be labelled A, B, C, D.
6. Only one option can be correct.
7. Include a short explanation for the correct answer.
8. Questions should test understanding, not just memorization.
9. Use clear student-friendly language.
10. Return ONLY valid JSON.
11. Do not use Markdown.
12. Do not include ```json.
13. Do not include any text outside the JSON.

Required JSON format:

{
    "questions": [
        {
            "question": "Question text",
            "options": {
                "A": "Option A",
                "B": "Option B",
                "C": "Option C",
                "D": "Option D"
            },
            "correct_answer": "A",
            "explanation": "Explanation"
        }
    ]
}
"""


# ============================================================
# GENERATE QUIZ
# ============================================================

def generate_quiz_questions(
    course_title: str,
    module_title: str,
    lecture_content: str,
    question_count: int = 5,
):

    prompt = f"""
Course:
{course_title}

Module:
{module_title}

Learning material:
{lecture_content}

Generate exactly {question_count} multiple-choice questions.
"""


    response = client.chat.completions.create(
        model=MODEL,

        messages=[
            {
                "role": "system",
                "content": QUIZ_SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],

        temperature=0.3,

        max_tokens=5000,
    )


    content = (
        response
        .choices[0]
        .message
        .content
    )


    if not content:
        raise RuntimeError(
            "Groq returned an empty response"
        )


    # --------------------------------------------------------
    # Remove accidental Markdown fences
    # --------------------------------------------------------

    content = content.strip()

    if content.startswith("```json"):
        content = content[7:]

    elif content.startswith("```"):
        content = content[3:]


    if content.endswith("```"):
        content = content[:-3]


    content = content.strip()


    # --------------------------------------------------------
    # Parse JSON
    # --------------------------------------------------------

    try:

        data = json.loads(content)

    except json.JSONDecodeError as exc:

        raise RuntimeError(
            f"Groq returned invalid quiz JSON: {exc}"
        )


    questions = data.get(
        "questions",
        []
    )


    if not isinstance(
        questions,
        list,
    ):
        raise RuntimeError(
            "Invalid quiz format"
        )


    # --------------------------------------------------------
    # Validate questions
    # --------------------------------------------------------

    validated = []


    for question in questions:

        question_text = question.get(
            "question"
        )

        options = question.get(
            "options"
        )

        correct_answer = question.get(
            "correct_answer"
        )

        explanation = question.get(
            "explanation",
            "",
        )


        if not question_text:
            continue


        if not isinstance(
            options,
            dict,
        ):
            continue


        required_options = [
            "A",
            "B",
            "C",
            "D",
        ]


        if any(
            option not in options
            for option in required_options
        ):
            continue


        if correct_answer not in required_options:
            continue


        validated.append(
            {
                "question":
                    str(question_text),

                "options":
                    {
                        "A":
                            str(options["A"]),

                        "B":
                            str(options["B"]),

                        "C":
                            str(options["C"]),

                        "D":
                            str(options["D"]),
                    },

                "correct_answer":
                    correct_answer,

                "explanation":
                    str(explanation),
            }
        )


    if len(validated) < 1:

        raise RuntimeError(
            "Groq did not generate valid quiz questions"
        )


    return validated[:question_count]
