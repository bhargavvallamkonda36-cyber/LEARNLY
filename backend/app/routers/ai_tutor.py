from fastapi import APIRouter, HTTPException

from app.schemas.ai_tutor import (
    AITutorRequest,
    AITutorResponse,
)

from app.services.ai_tutor_service import (
    generate_ai_response,
)


router = APIRouter(
    prefix="/ai-tutor",
    tags=["AI Tutor"],
)


@router.post(
    "/chat",
    response_model=AITutorResponse,
)
def chat_with_ai(
    request: AITutorRequest,
):

    try:

        answer = generate_ai_response(
            message=request.message,
            course=request.course,
            module=request.module,
            history=[
                {
                    "role": item.role,
                    "content": item.content,
                }
                for item in request.history
            ],
        )


        return AITutorResponse(
            answer=answer,
            course=request.course,
            module=request.module,
        )


    except Exception as exc:

        print(
            "AI Tutor Error:",
            repr(exc),
        )


        raise HTTPException(
            status_code=500,
            detail=(
                "AI Tutor could not generate a response. "
                "Check the backend terminal."
            ),
        )
    