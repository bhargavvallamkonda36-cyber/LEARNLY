import {
  useCallback,
  useState,
} from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  askAITutor,
  getQuizHistory,
  getAccessToken,
} from "../services/aiTutor";

import CourseModuleSelector from "./CourseModuleSelector";

import "../styles/AITutor.css";


// ============================================================
// AI TUTOR
// ============================================================

export default function AITutor() {

  // ==========================================================
  // CHAT
  // ==========================================================

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your Learnly AI Tutor. Ask me anything about your studies.",
    },
  ]);

  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);


  // ==========================================================
  // LEARNING CONTEXT
  // ==========================================================

  const [learningContext, setLearningContext] =
    useState({
      course: "General",
      module: "General",
      courseId: "",
      moduleId: "",
    });


  // ==========================================================
  // STUDY MODE
  // ==========================================================

  const [studyMode, setStudyMode] =
    useState("learn");


  // ==========================================================
  // QUIZ STATE
  // ==========================================================

  const [quiz, setQuiz] =
    useState(null);

  const [quizAnswers, setQuizAnswers] =
    useState({});

  const [quizResult, setQuizResult] =
    useState(null);

  const [quizLoading, setQuizLoading] =
    useState(false);

  const [quizError, setQuizError] =
    useState("");

  const [showQuiz, setShowQuiz] =
    useState(false);


  // ==========================================================
  // QUIZ HISTORY
  // ==========================================================

  const [quizHistory, setQuizHistory] =
    useState(null);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [historyError, setHistoryError] =
    useState("");

  const [showHistory, setShowHistory] =
    useState(false);


  // ==========================================================
  // CONTEXT CALLBACK
  // ==========================================================

  const handleContextChange =
    useCallback((context) => {

      setLearningContext(context);

      setQuiz(null);

      setQuizAnswers({});

      setQuizResult(null);

      setQuizError("");

      setShowQuiz(false);

    }, []);


  // ==========================================================
  // SEND MESSAGE
  // ==========================================================

  async function handleSend(customQuestion = null) {

    const question = (
      customQuestion ??
      input
    ).trim();

    if (!question || loading) {
      return;
    }

    const history =
      messages.map(
        (message) => ({
          role: message.role,
          content: message.content,
        })
      );

    setMessages(
      (current) => [
        ...current,
        {
          role: "user",
          content: question,
        },
      ]
    );

    setInput("");

    setLoading(true);

    try {

      const result =
        await askAITutor({
          message: question,

          course:
            learningContext.course,

          module:
            learningContext.module,

          history,
        });

      setMessages(
        (current) => [
          ...current,
          {
            role: "assistant",
            content:
              result.answer ||
              "I couldn't generate an answer.",
          },
        ]
      );

    } catch (error) {

      console.error(
        "AI Tutor error:",
        error
      );

      setMessages(
        (current) => [
          ...current,
          {
            role: "assistant",
            content:
              `Sorry, I couldn't answer that.\n\n${error.message}`,
          },
        ]
      );

    } finally {

      setLoading(false);

    }
  }


  // ==========================================================
  // ENTER KEY
  // ==========================================================

  function handleKeyDown(event) {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      handleSend();

    }
  }


  // ==========================================================
  // CLEAR CHAT
  // ==========================================================

  function clearChat() {

    if (
      loading ||
      quizLoading ||
      historyLoading
    ) {
      return;
    }

    setMessages([
      {
        role: "assistant",
        content:
          "Hi! I'm your Learnly AI Tutor. Ask me anything about your studies.",
      },
    ]);

    setQuiz(null);

    setQuizAnswers({});

    setQuizResult(null);

    setQuizError("");

    setShowQuiz(false);

    setShowHistory(false);

  }


  // ==========================================================
  // LOAD QUIZ HISTORY
  // ==========================================================

  async function loadQuizHistory() {

    const token =
      getAccessToken();

    if (!token) {

      setHistoryError(
        "Please log in as a student to view quiz history."
      );

      setShowHistory(true);

      return;
    }

    setHistoryLoading(true);

    setHistoryError("");

    try {

      const data =
        await getQuizHistory();

      setQuizHistory(data);

      setShowHistory(true);

    } catch (error) {

      console.error(
        "Quiz history error:",
        error
      );

      setHistoryError(
        error.message ||
        "Unable to load quiz history."
      );

      setShowHistory(true);

    } finally {

      setHistoryLoading(false);

    }
  }


  // ==========================================================
  // CLOSE HISTORY
  // ==========================================================

  function closeHistory() {

    if (historyLoading) {
      return;
    }

    setShowHistory(false);

    setHistoryError("");

  }


  // ==========================================================
  // GENERATE REAL AI QUIZ
  // ==========================================================

  async function generateRealQuiz() {

    if (
      !learningContext.courseId ||
      !learningContext.moduleId
    ) {

      setQuizError(
        "Please select a course and module first."
      );

      setShowQuiz(true);

      return;
    }

    const token =
      getAccessToken();

    if (!token) {

      setQuizError(
        "Please log in as a student before generating a quiz."
      );

      setShowQuiz(true);

      return;
    }

    setQuizLoading(true);

    setQuizError("");

    setQuizResult(null);

    setQuizAnswers({});

    setShowQuiz(true);

    setShowHistory(false);

    try {

      const response =
        await fetch(
          `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1"}/ai-tutor/quiz/generate`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({

              course_id:
                learningContext.courseId,

              module_id:
                learningContext.moduleId,

              question_count: 5,

            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Failed to generate quiz."
        );

      }

      setQuiz(data);

      setQuizAnswers({});

      setQuizResult(null);

    } catch (error) {

      console.error(
        "Quiz generation error:",
        error
      );

      setQuizError(
        error.message ||
        "Unable to generate quiz."
      );

    } finally {

      setQuizLoading(false);

    }
  }


  // ==========================================================
  // GENERATE QUIZ BUTTON
  // ==========================================================

  function generateQuiz() {

    generateRealQuiz();

  }


  // ==========================================================
  // SELECT QUIZ ANSWER
  // ==========================================================

  function selectQuizAnswer(
    questionId,
    optionIndex
  ) {

    if (quizResult) {
      return;
    }

    const optionLetters = [
      "A",
      "B",
      "C",
      "D",
    ];

    setQuizAnswers(
      (current) => ({
        ...current,

        [questionId]:
          optionLetters[
            optionIndex
          ],
      })
    );

  }


  // ==========================================================
  // SUBMIT QUIZ
  // ==========================================================

  async function submitQuiz() {

    if (!quiz) {
      return;
    }

    const token =
      getAccessToken();

    if (!token) {

      setQuizError(
        "Please log in before submitting the quiz."
      );

      return;
    }

    const unanswered =
      quiz.questions.filter(
        (question) =>
          !quizAnswers[
            question.id
          ]
      );

    if (unanswered.length > 0) {

      setQuizError(
        `Please answer all questions. ${unanswered.length} question(s) remaining.`
      );

      return;
    }

    setQuizLoading(true);

    setQuizError("");

    try {

      const answers =
        quiz.questions.map(
          (question) => ({

            question_id:
              question.id,

            selected_answer:
              quizAnswers[
                question.id
              ],

          })
        );

      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL ||
        "http://127.0.0.1:8000/api/v1";

      const response =
        await fetch(
          `${API_BASE_URL}/ai-tutor/quiz/submit`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({

              quiz_id:
                quiz.id,

              answers,

            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Failed to submit quiz."
        );

      }

      setQuizResult(data);

      // ------------------------------------------------------
      // Refresh quiz history after successful submission
      // ------------------------------------------------------

      try {

        const updatedHistory =
          await getQuizHistory();

        setQuizHistory(
          updatedHistory
        );

      } catch (historyError) {

        console.warn(
          "Unable to refresh quiz history:",
          historyError
        );

      }

    } catch (error) {

      console.error(
        "Quiz submission error:",
        error
      );

      setQuizError(
        error.message ||
        "Unable to submit quiz."
      );

    } finally {

      setQuizLoading(false);

    }
  }


  // ==========================================================
  // CLOSE QUIZ
  // ==========================================================

  function closeQuiz() {

    if (quizLoading) {
      return;
    }

    setShowQuiz(false);

    setQuizError("");

  }


  // ==========================================================
  // STUDY MODE
  // ==========================================================

  function changeStudyMode(mode) {

    setStudyMode(mode);

    if (mode === "quiz") {

      generateRealQuiz();

      return;
    }

    const prompts = {

      learn:
        "Teach me the current topic from the beginning in a clear and simple way with examples.",

      hint:
        "Give me a useful learning hint about the current topic. Do not directly give the complete answer. Guide me toward it.",

      practice:
        "Give me a practical coding or problem-solving exercise about the current topic. Do not immediately give the answer.",

      exam:
        "Give me an exam-style question about the current topic. Wait for my answer and then evaluate it.",

    };

    const prompt =
      prompts[mode];

    if (prompt) {

      handleSend(prompt);

    }

  }


  // ==========================================================
  // QUICK ACTIONS
  // ==========================================================

  function explainTopic() {

    handleSend(
      "Explain this topic in simple terms with examples. Use headings, bullet points, and code examples where appropriate."
    );

  }


  function summarizeTopic() {

    handleSend(
      "Give me a short summary of this topic with the most important concepts, definitions, and points to remember."
    );

  }


  function practiceTopic() {

    handleSend(
      "Give me a practical coding exercise for this topic. Explain the task, requirements, and expected output. Do not immediately provide the solution."
    );

  }


  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  function formatDate(dateString) {

    if (!dateString) {
      return "Unknown date";
    }

    try {

      return new Date(
        dateString
      ).toLocaleString();

    } catch {

      return dateString;

    }
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="ai-tutor-page">

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="ai-tutor-header">

        <div>

          <h1>
            AI Tutor
          </h1>

          <p>
            Your intelligent learning assistant.
          </p>

        </div>


        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >

          <button
            className="clear-chat-button"
            onClick={
              loadQuizHistory
            }
            disabled={
              loading ||
              quizLoading ||
              historyLoading
            }
          >
            {historyLoading
              ? "Loading..."
              : "📊 Quiz History"}
          </button>


          <button
            className="clear-chat-button"
            onClick={
              clearChat
            }
            disabled={
              loading ||
              quizLoading ||
              historyLoading
            }
          >
            Clear Chat
          </button>

        </div>

      </div>


      {/* ================================================== */}
      {/* COURSE + MODULE */}
      {/* ================================================== */}

      <CourseModuleSelector
        onContextChange={
          handleContextChange
        }
      />


      {/* ================================================== */}
      {/* CURRENT CONTEXT */}
      {/* ================================================== */}

      <div className="ai-context">

        <span>
          📘{" "}
          {learningContext.course}
        </span>

        <span>
          📚{" "}
          {learningContext.module}
        </span>

      </div>


      {/* ================================================== */}
      {/* STUDY MODES */}
      {/* ================================================== */}

      <div className="study-mode-section">

        <div className="study-mode-title">
          STUDY MODE
        </div>


        <div className="study-mode-buttons">

          <button
            className={
              studyMode === "learn"
                ? "active"
                : ""
            }
            onClick={() =>
              changeStudyMode(
                "learn"
              )
            }
            disabled={
              loading ||
              quizLoading
            }
          >
            📖 Learn
          </button>


          <button
            className={
              studyMode === "hint"
                ? "active"
                : ""
            }
            onClick={() =>
              changeStudyMode(
                "hint"
              )
            }
            disabled={
              loading ||
              quizLoading
            }
          >
            💡 Hint
          </button>


          <button
            className={
              studyMode === "practice"
                ? "active"
                : ""
            }
            onClick={() =>
              changeStudyMode(
                "practice"
              )
            }
            disabled={
              loading ||
              quizLoading
            }
          >
            💻 Practice
          </button>


          <button
            className={
              studyMode === "quiz"
                ? "active"
                : ""
            }
            onClick={() =>
              changeStudyMode(
                "quiz"
              )
            }
            disabled={
              loading ||
              quizLoading
            }
          >
            🧠 Quiz
          </button>


          <button
            className={
              studyMode === "exam"
                ? "active"
                : ""
            }
            onClick={() =>
              changeStudyMode(
                "exam"
              )
            }
            disabled={
              loading ||
              quizLoading
            }
          >
            🎯 Exam
          </button>

        </div>

      </div>


      {/* ================================================== */}
      {/* QUICK ACTIONS */}
      {/* ================================================== */}

      <div className="ai-quick-actions">

        <button
          onClick={
            explainTopic
          }
          disabled={
            loading ||
            quizLoading
          }
        >
          💡 Explain
        </button>


        <button
          onClick={
            summarizeTopic
          }
          disabled={
            loading ||
            quizLoading
          }
        >
          📝 Summarize
        </button>


        <button
          onClick={
            generateQuiz
          }
          disabled={
            loading ||
            quizLoading
          }
        >
          {quizLoading
            ? "⏳ Generating..."
            : "🧠 Generate Quiz"}
        </button>


        <button
          onClick={
            practiceTopic
          }
          disabled={
            loading ||
            quizLoading
          }
        >
          💻 Practice
        </button>


        <button
          onClick={
            loadQuizHistory
          }
          disabled={
            loading ||
            quizLoading ||
            historyLoading
          }
        >
          📊 History
        </button>

      </div>


      {/* ================================================== */}
      {/* QUIZ HISTORY */}
      {/* ================================================== */}

      {showHistory && (

        <div
          className="ai-quiz-container"
          style={{
            marginTop: "24px",
          }}
        >

          <div className="ai-quiz-header">

            <div>

              <h2>
                📊 Quiz History
              </h2>

              <p>
                Review your previous quiz attempts.
              </p>

            </div>


            <button
              className="quiz-close-button"
              onClick={
                closeHistory
              }
              disabled={
                historyLoading
              }
            >
              ✕
            </button>

          </div>


          {/* ============================================== */}
          {/* HISTORY ERROR */}
          {/* ============================================== */}

          {historyError && (

            <div className="quiz-error">

              ⚠️{" "}
              {historyError}

            </div>

          )}


          {/* ============================================== */}
          {/* HISTORY LOADING */}
          {/* ============================================== */}

          {historyLoading && (

            <div className="quiz-loading">

              <div className="quiz-loading-icon">
                📊
              </div>

              <h3>
                Loading quiz history...
              </h3>

              <p>
                Fetching your previous attempts.
              </p>

            </div>

          )}


          {/* ============================================== */}
          {/* HISTORY DATA */}
          {/* ============================================== */}

          {!historyLoading &&
            !historyError &&
            quizHistory && (

              <div>

                {/* ---------------------------------------- */}
                {/* SUMMARY */}
                {/* ---------------------------------------- */}

                <div
                  className="quiz-score-card"
                  style={{
                    marginBottom: "24px",
                  }}
                >

                  <div className="quiz-score-icon">
                    📚
                  </div>

                  <h2>
                    Your Quiz Performance
                  </h2>

                  <div className="quiz-score">
                    {
                      quizHistory.total_attempts ??
                      0
                    }
                  </div>

                  <p>
                    Total quiz attempts
                  </p>

                </div>


                {/* ---------------------------------------- */}
                {/* NO ATTEMPTS */}
                {/* ---------------------------------------- */}

                {(
                  quizHistory.attempts ||
                  []
                ).length === 0 ? (

                  <div className="quiz-loading">

                    <div className="quiz-loading-icon">
                      📝
                    </div>

                    <h3>
                      No quiz attempts yet
                    </h3>

                    <p>
                      Generate and complete a quiz to see your history here.
                    </p>

                  </div>

                ) : (

                  <div className="quiz-results-list">

                    <h3>
                      Previous Attempts
                    </h3>


                    {(
                      quizHistory.attempts ||
                      []
                    ).map(
                      (
                        attempt,
                        index
                      ) => (

                        <div
                          key={
                            attempt.attempt_id ||
                            index
                          }
                          className="quiz-result-item"
                        >

                          {/* ------------------------------ */}
                          {/* TITLE */}
                          {/* ------------------------------ */}

                          <div
                            className="quiz-result-question"
                          >

                            <span>
                              {attempt.percentage >= 70
                                ? "✅"
                                : attempt.percentage >= 40
                                  ? "⚠️"
                                  : "❌"}
                            </span>

                            <strong>
                              {attempt.quiz_title ||
                                `Quiz Attempt ${index + 1}`}
                            </strong>

                          </div>


                          {/* ------------------------------ */}
                          {/* COURSE */}
                          {/* ------------------------------ */}

                          <p>

                            📘{" "}
                            <strong>
                              Course:
                            </strong>{" "}

                            {attempt.course_title ||
                              "Unknown Course"}

                          </p>


                          {/* ------------------------------ */}
                          {/* MODULE */}
                          {/* ------------------------------ */}

                          <p>

                            📚{" "}
                            <strong>
                              Module:
                            </strong>{" "}

                            {attempt.module_title ||
                              "Unknown Module"}

                          </p>


                          {/* ------------------------------ */}
                          {/* SCORE */}
                          {/* ------------------------------ */}

                          <div
                            className="quiz-result-answer"
                          >

                            <span>
                              Score:
                            </span>

                            <strong>
                              {attempt.score ??
                                0}
                              %
                            </strong>

                          </div>


                          {/* ------------------------------ */}
                          {/* CORRECT */}
                          {/* ------------------------------ */}

                          <div
                            className="quiz-result-answer"
                          >

                            <span>
                              Correct:
                            </span>

                            <strong>
                              {
                                attempt.correct_answers ??
                                0
                              }
                              /
                              {
                                attempt.total_questions ??
                                0
                              }
                            </strong>

                          </div>


                          {/* ------------------------------ */}
                          {/* DATE */}
                          {/* ------------------------------ */}

                          <div
                            className="quiz-result-answer"
                          >

                            <span>
                              Completed:
                            </span>

                            <strong>
                              {
                                formatDate(
                                  attempt.completed_at
                                )
                              }
                            </strong>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>

            )}

        </div>

      )}


      {/* ================================================== */}
      {/* QUIZ AREA */}
      {/* ================================================== */}

      {showQuiz && (

        <div className="ai-quiz-container">

          {/* ============================================== */}
          {/* QUIZ HEADER */}
          {/* ============================================== */}

          <div className="ai-quiz-header">

            <div>

              <h2>
                {quiz?.title ||
                  "AI Quiz"}
              </h2>

              <p>
                {quiz?.description ||
                  `Test your knowledge of ${learningContext.module}.`}
              </p>

            </div>


            <button
              className="quiz-close-button"
              onClick={
                closeQuiz
              }
              disabled={
                quizLoading
              }
            >
              ✕
            </button>

          </div>


          {/* ============================================== */}
          {/* ERROR */}
          {/* ============================================== */}

          {quizError && (

            <div className="quiz-error">

              ⚠️{" "}
              {quizError}

            </div>

          )}


          {/* ============================================== */}
          {/* GENERATING */}
          {/* ============================================== */}

          {quizLoading &&
            !quiz && (

              <div className="quiz-loading">

                <div className="quiz-loading-icon">
                  🧠
                </div>

                <h3>
                  Generating your quiz...
                </h3>

                <p>
                  Learnly AI is creating
                  questions based on the
                  selected module.
                </p>

              </div>

            )}


          {/* ============================================== */}
          {/* QUIZ QUESTIONS */}
          {/* ============================================== */}

          {quiz &&
            !quizResult && (

              <div className="quiz-questions">

                <div className="quiz-progress">

                  <span>
                    {quiz.questions.length}
                    {" "}
                    Questions
                  </span>

                  <span>
                    {
                      Object.keys(
                        quizAnswers
                      ).length
                    }
                    /
                    {quiz.questions.length}
                    {" "}
                    Answered
                  </span>

                </div>


                {quiz.questions.map(
                  (
                    question,
                    questionIndex
                  ) => (

                    <div
                      key={
                        question.id
                      }
                      className="quiz-question-card"
                    >

                      <div className="quiz-question-number">

                        Question{" "}
                        {questionIndex + 1}

                      </div>


                      <h3>
                        {question.question}
                      </h3>


                      <div className="quiz-options">

                        {question.options.map(
                          (
                            option,
                            optionIndex
                          ) => {

                            const letter =
                              [
                                "A",
                                "B",
                                "C",
                                "D",
                              ][
                                optionIndex
                              ];

                            const selected =
                              quizAnswers[
                                question.id
                              ] === letter;

                            return (

                              <button
                                key={
                                  optionIndex
                                }
                                className={
                                  selected
                                    ? "quiz-option selected"
                                    : "quiz-option"
                                }
                                onClick={() =>
                                  selectQuizAnswer(
                                    question.id,
                                    optionIndex
                                  )
                                }
                              >

                                <span className="quiz-option-letter">
                                  {letter}
                                </span>

                                <span>
                                  {option}
                                </span>

                              </button>

                            );

                          }
                        )}

                      </div>

                    </div>

                  )
                )}


                <button
                  className="submit-quiz-button"
                  onClick={
                    submitQuiz
                  }
                  disabled={
                    quizLoading
                  }
                >
                  {quizLoading
                    ? "Submitting..."
                    : "Submit Quiz"}
                </button>

              </div>

            )}


          {/* ============================================== */}
          {/* QUIZ RESULT */}
          {/* ============================================== */}

          {quizResult && (

            <div className="quiz-result">

              <div className="quiz-score-card">

                <div className="quiz-score-icon">
                  🎯
                </div>

                <h2>
                  Quiz Completed!
                </h2>

                <div className="quiz-score">
                  {quizResult.score}%
                </div>

                <p>
                  You got{" "}
                  <strong>
                    {
                      quizResult.correct_answers
                    }
                  </strong>
                  {" "}
                  out of{" "}
                  <strong>
                    {
                      quizResult.total_questions
                    }
                  </strong>
                  {" "}
                  questions correct.
                </p>

              </div>


              <div className="quiz-results-list">

                <h3>
                  Answer Review
                </h3>


                {quizResult.results.map(
                  (
                    result,
                    index
                  ) => (

                    <div
                      key={
                        result.question_id
                      }
                      className={
                        result.correct
                          ? "quiz-result-item correct"
                          : "quiz-result-item incorrect"
                      }
                    >

                      <div className="quiz-result-question">

                        <span>
                          {result.correct
                            ? "✅"
                            : "❌"}
                        </span>

                        <strong>
                          Question{" "}
                          {index + 1}
                        </strong>

                      </div>


                      <p>
                        {result.question}
                      </p>


                      <div className="quiz-result-answer">

                        <span>
                          Your answer:
                        </span>

                        <strong>
                          {result.selected_answer ||
                            "Not answered"}
                        </strong>

                      </div>


                      {!result.correct && (

                        <div className="quiz-result-answer">

                          <span>
                            Correct answer:
                          </span>

                          <strong>
                            {
                              result.correct_answer
                            }
                          </strong>

                        </div>

                      )}


                      {result.explanation && (

                        <div className="quiz-explanation">

                          <strong>
                            Explanation:
                          </strong>

                          <p>
                            {
                              result.explanation
                            }
                          </p>

                        </div>

                      )}

                    </div>

                  )
                )}

              </div>


              <div className="quiz-result-actions">

                <button
                  onClick={
                    generateRealQuiz
                  }
                  disabled={
                    quizLoading
                  }
                >
                  🔄 Generate New Quiz
                </button>


                <button
                  onClick={
                    loadQuizHistory
                  }
                  disabled={
                    historyLoading
                  }
                >
                  📊 View Quiz History
                </button>


                <button
                  onClick={
                    closeQuiz
                  }
                >
                  ← Back to AI Tutor
                </button>

              </div>

            </div>

          )}

        </div>

      )}


      {/* ================================================== */}
      {/* CHAT CONTAINER */}
      {/* ================================================== */}

      {!showQuiz &&
        !showHistory && (

          <div className="ai-tutor-container">

            <div className="ai-tutor-messages">

              {messages.map(
                (
                  message,
                  index
                ) => (

                  <div
                    key={index}
                    className={
                      message.role === "user"
                        ? "ai-message user-message"
                        : "ai-message assistant-message"
                    }
                  >

                    <div className="message-content">

                      {message.role === "assistant" ? (

                        <ReactMarkdown
                          remarkPlugins={[
                            remarkGfm,
                          ]}
                        >
                          {
                            message.content
                          }
                        </ReactMarkdown>

                      ) : (

                        <div>
                          {
                            message.content
                          }
                        </div>

                      )}

                    </div>

                  </div>

                )
              )}


              {loading && (

                <div className="ai-message assistant-message">

                  <div className="message-content">

                    <div className="typing-indicator">

                      <span></span>

                      <span></span>

                      <span></span>

                      <span className="thinking-text">
                        AI Tutor is thinking...
                      </span>

                    </div>

                  </div>

                </div>

              )}

            </div>


            {/* ================================================== */}
            {/* INPUT */}
            {/* ================================================== */}

            <div className="ai-tutor-input-area">

              <textarea
                value={input}
                onChange={(event) =>
                  setInput(
                    event.target.value
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                placeholder="Ask your AI Tutor..."
                rows={1}
                disabled={loading}
              />


              <button
                onClick={() =>
                  handleSend()
                }
                disabled={
                  loading ||
                  !input.trim()
                }
              >
                {loading
                  ? "Thinking..."
                  : "Send"}
              </button>

            </div>

          </div>

        )}

    </div>
  );
}
