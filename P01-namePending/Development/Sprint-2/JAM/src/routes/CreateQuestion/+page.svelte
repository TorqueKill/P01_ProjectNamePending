<script>
  // @ts-nocheck

  import { goto } from "$app/navigation";
  import { user } from "$lib/userStore.js";

  const MAX_TIME_LIMIT = 60;

  let quiz1 = [
    {
      question: "",
      answer: "",
      choices: ["", "", "", ""],
      timeLimit: 30,
      imageUrl: "",
    },
  ];

  function addQuestion() {
    quiz1.push({
      question: "",
      answer: "",
      choices: ["", "", "", ""],
      timeLimit: 30,
      imageUrl: "",
    });
    quiz1 = quiz1;
  }

  function updateAnswer(questionIndex, choiceText) {
    quiz1[questionIndex].answer = choiceText;
  }

  function updateQuestionText(questionIndex, event) {
    const target = event.currentTarget;
    quiz1[questionIndex].question = target.value;
  }

  function updateOptionText(questionIndex, optionIndex, event) {
    const target = event.currentTarget;
    quiz1[questionIndex].choices[optionIndex] = target.value;
  }

  function updateImageUrl(questionIndex, event) {
    const target = event.currentTarget;
    quiz1[questionIndex].imageUrl = target.value;
  }

  function populateIfBlank(quiz) {
    for (let i = 0; i < quiz.length; i++) {
      if (quiz[i].question == "") {
        quiz[i].question = "Question " + (i + 1);
      }
      for (let j = 0; j < quiz[i].choices.length; j++) {
        if (quiz[i].choices[j] == "") {
          quiz[i].choices[j] = "Option " + (j + 1);
        }
      }
      if (quiz[i].answer == "") {
        quiz[i].answer = quiz[i].choices[0];
      }


    }
    return quiz;
  }

  function increaseTime(questionIndex) {
    if (quiz1[questionIndex].timeLimit < MAX_TIME_LIMIT) {
      quiz1[questionIndex].timeLimit += 5;
    }
  }

  function saveQuiz() {
    let saveingQuiz = quiz1;
    populateIfBlank(saveingQuiz);
    console.log(saveingQuiz);
    localStorage.setItem("Quiz", JSON.stringify([quiz1]));
    goto("/createQuiz");
  }
</script>

<main>
  <body>
    <!-- <div class="container">
            <div class="row align-items-center">
                <div class="col">
                    <p id="question1">Question 1</p>
                </div>
                <div class="col-auto">
                    <button on:click={increaseTime} class="btn btn-primary btn-block btn-space ml-auto">
                        Set time limit: {timeLimit} seconds
                    </button>
                </div>
            </div>
        </div> -->
    <div class="container">
      {#each quiz1 as question, qIndex}
        <div class="question-cont">
          <div class="quizz">
            <label for={`question-${qIndex}`}>Question {qIndex + 1}</label>
            <input
              type="text"
              id={`question-${qIndex}`}
              class="form-control quizz"
              placeholder="Type your question here"
              on:input={(
                /** @type {Event & { currentTarget: EventTarget & HTMLInputElement; }} */ event
              ) => updateQuestionText(qIndex, event)}
            />

            
          </div>
          {#each question.choices as choice, oIndex}
            <div class="option-group">
              <input
                type="text"
                class="form-control options"
                placeholder="Enter option"
                on:input={(event) => updateOptionText(qIndex, oIndex, event)}
                bind:value={question.choices[oIndex]}
              />
              <input
                type="radio"
                class="form-check-input"
                checked={choice === question.answer}
                bind:group={question.answer}
                value={choice}
                on:change={() => updateAnswer(qIndex, choice)}
                name={`option-${qIndex}`}
              />
            </div>
          {/each}

          <div class="image-input-container">
            <div class="quizz">
              <label for={`image-url-${qIndex}`}>Image URL (optional)</label>
              <input
                type="text"
                id={`image-url-${qIndex}`}
                class="form-control quizz"
                placeholder="Enter image URL"
                on:input={(event) => updateImageUrl(qIndex, event)}
                value={question.imageUrl}
              />
            </div>
            {#if question.imageUrl}
              <img src={question.imageUrl} class="image-preview" alt={`Image for Question ${qIndex + 1}`} />
            {/if}
          </div>
        </div>
        <div class="col-auto">
          <button
            on:click={() => {
              increaseTime(qIndex);
            }}
            class="btn btn-primary btn-block btn-space ml-auto"
          >
            Time limit: {question.timeLimit} seconds
          </button>
        </div>
      {/each}
      <div class="container-md">
        <div class="btn-group">
          <div id="addQuestion">
            <button on:click={addQuestion} class="btn btn-quat"
              >Add question</button
            >
            <!-- <button class="btn btn-tertiary btn-block btn-space ml-auto"> Add question </button>  -->
          </div>
          <div class="col-auto" id="saveBtn">
            <button
              on:click|once={() => {
                saveQuiz();
              }}
              class="btn btn-secondary btn-block btn-space ml-auto"
            >
              Save
            </button>
          </div>
          <div class="col-auto" id="cancelBtn">
            <button
              class="btn btn-quaternary"
              on:click={() => {
                goto("/createQuiz");
              }}>Back</button
            >
          </div>
        </div>
      </div>
    </div>
  </body>
</main>

<style>
  body {
    background: #7801a8;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }

  .container {
    height: auto;
    background: #018198;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
    border-radius: 51px;
    padding: 2rem;
    margin: 1rem auto;
    display: flex;
    flex-direction: column;
  }

  .btn {
    background-color: #ccc;
    border: none;
    color: white;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    margin: 4px 2px;
    cursor: pointer;
    border-radius: 5px;
    transition: all 0.3s ease;
  }

  .btn:hover {
    background-color: #c49eff;
  }

  #cancelBtn .btn-quaternary:hover {
    background-color: red;
  }

  .option-group {
    display: flex;
    align-items: center;
  }

  .question-cont {
    position: relative;
    margin-bottom: 2rem;
    margin-top: 2rem;
  }

  .btn-quaternary:hover {
    background-color: red;
  }

  .form-check-input {
    position: relative;
    z-index: 1;
    margin-top: 1.75rem;
  }

  .form-control.options {
    margin-left: 1rem;
    margin-top: 1.5rem;
    border-radius: 15px;
    border: None;
    height: 2rem;
    padding-left: 0.5rem;
  }

  .quizz {
    font-size: 20px;
    border-radius: 15px;
    border: None;
    padding-left: 0.5rem;
    margin-top: 0.5rem;
    margin-bottom: 2rem;
    color: red;
    height: 2rem;
    width: 100%;
    flex-grow: 2; /* Adjust as needed for your layout */
    margin-right: 10px; /* Adds some space between the input and the image preview */
  }

  @media screen and (max-width: 768px) {
    .container {
      width: 80%;
      margin-left: auto;
      margin-right: auto;
    }

    .btn {
      padding: 10px;
      font-size: 14px;
      border-radius: 15px;
    }
  }

  @media screen and (min-width: 769px) {
    .container {
      padding: 2rem;
    }

    .btn {
      padding: 10px 25px;
      font-size: 18px;
      border-radius: 20px;
    }
  }

  .image-input-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .image-preview {
    flex-grow: 1;
    max-width: 100px; /* or other desired size */
    height: auto;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
    </style>
    
