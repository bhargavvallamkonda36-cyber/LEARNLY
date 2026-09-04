from app.config import settings
from groq import Groq


# ============================================================
# GROQ CLIENT
# ============================================================

if not settings.GROQ_API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY is not configured. "
        "Add GROQ_API_KEY to backend/.env"
    )


client = Groq(
    api_key=settings.GROQ_API_KEY
)


# ============================================================
# MODEL
# ============================================================

MODEL = (
    settings.GROQ_MODEL
    or "llama-3.3-70b-versatile"
)


# ============================================================
# SYSTEM PROMPT
# ============================================================

SYSTEM_PROMPT = """
You are Learnly AI Tutor, an intelligent educational assistant.

Your job is to help students understand academic topics.

IMPORTANT RULES:

1. Explain concepts clearly and accurately.

2. Adapt explanations to the student's current course
   and module.

3. Prefer simple language for beginners.

4. Use examples whenever useful.

5. Use Markdown formatting.

6. Use headings for major sections.

7. Use bullet points for lists.

8. Use tables when comparisons are useful.

9. Always use fenced code blocks for programming code.

10. For Java and Python questions, provide correct,
    runnable code when the student asks for code.

11. Explain code step-by-step when appropriate.

12. If the student asks for a quiz, clearly format
    the questions and options.

13. If the student asks for a hint, do NOT immediately
    reveal the complete solution.

14. If the student asks for practice, give the task,
    requirements and expected output without immediately
    giving the complete solution.

15. If the student asks an exam-style question, wait
    for the student's answer before evaluating it.

16. Do not unnecessarily repeat the student's question.

17. Do not claim information that you do not know.

18. Stay focused on education and learning.

19. Use the current course and module as learning context.

20. Never intentionally provide misleading information.
"""


# ============================================================
# GENERATE AI RESPONSE
# ============================================================

def generate_ai_response(
    message: str,
    course: str = "General",
    module: str | None = None,
    history: list | None = None,
):

    history = history or []


    # ========================================================
    # LEARNING CONTEXT
    # ========================================================

    context = f"""
CURRENT LEARNING CONTEXT

Course:
{course}

Module:
{module or "General"}

Use this context when answering the student's question.
"""


    # ========================================================
    # SYSTEM MESSAGE
    # ========================================================

    messages = [
        {
            "role": "system",
            "content": (
                SYSTEM_PROMPT
                + "\n"
                + context
            ),
        }
    ]


    # ========================================================
    # CONVERSATION HISTORY
    # ========================================================

    for item in history[-10:]:

        role = item.get("role")

        content = item.get("content")


        if (
            role in ["user", "assistant"]
            and content
        ):

            messages.append(
                {
                    "role": role,
                    "content": content,
                }
            )


    # ========================================================
    # CURRENT USER MESSAGE
    # ========================================================

    messages.append(
        {
            "role": "user",
            "content": message,
        }
    )


    # ========================================================
    # GROQ REQUEST
    # ========================================================

    response = client.chat.completions.create(

        model=MODEL,

        messages=messages,

        temperature=0.4,

        max_tokens=2500,
    )


    # ========================================================
    # RESPONSE
    # ========================================================

    answer = (
        response.choices[0]
        .message
        .content
    )


    return answer
