<script lang="js">
  // @ts-nocheck

  import { goto } from "$app/navigation";
  import { quiz1, quiz2, quiz3 } from "$lib/dummyQuiz.js";
  import { onMount } from "svelte";
  import { user } from "$lib/userStore.js";

  let quizzes;
  let displayQuizCheck;
  let quizToDisplay = [];
  let quizChosen;
  let quizIdx;
  let showHostSettingsModal = false;
  let isQuizSelected = false;

  const openHostSettingsModal = () => {
    showHostSettingsModal = true;
  };

  const closeHostSettingsModal = () => {
    showHostSettingsModal = false;
  };

  onMount(() => {
    let savedQuizzes = JSON.parse(localStorage.getItem("Quiz")) || [];
    if (savedQuizzes.length > 7) {
      savedQuizzes = savedQuizzes.slice(0, 6);
      localStorage.setItem("Quiz", JSON.stringify(savedQuizzes));
    }
    quizzes = [quiz1, quiz2, quiz3, ...savedQuizzes];
    displayQuizCheck = false;
    console.log("Loaded quizzes:", quizzes);
  });

  // onMount(() => {
  //   //append more from local storage if any
  //   const savedQuizzes = JSON.parse(localStorage.getItem("Quiz")) || [];
  //   console.log(savedQuizzes);
  //   // localStorage.setItem("Quiz", JSON.stringify(savedQuizzes));

  //   quizzes = [...savedQuizzes];
  //   displayQuizCheck = false;
  //   console.log(quizzes);
  // });

  //need to sugar quiz if its in the format of quiz1,2,3
  //which is [{question,answer,choices:[choice1,choice2,choice3,choice4]}, ...]
  const sugarQuiz = (quiz) => {
    //wrap each question in []
    let newQuiz = [];
    for (let x in quiz) {
      //also wrap choices in []
      let newChoices = [];
      for (let y in quiz[x].choices) {
        newChoices.push(quiz[x].choices[y]);
      }
      newQuiz.push({
        question: quiz[x].question,
        answer: quiz[x].answer,
        options: newChoices,
        timeLimit: quiz[x].timeLimit,
      });
    }
    return newQuiz;
  };

  function displayQuiz(quiz, idx) {
    //console.log(quizzes);
    quizToDisplay = sugarQuiz(quiz);
    displayQuizCheck = true;
    quizIdx = idx;
  }

  const closeQuiz = () => {
    displayQuizCheck = false;
  };

  //MAKE SURE TO SAVE QUIZ FROM THE OG QUIZ ARRAY
  const chooseQuiz = () => {
    $user.hostQuiz = quizzes[quizIdx];
    quizChosen = true;
    displayQuizCheck = false;
    isQuizSelected = true;
  };

  // update questions, answers, options, and time limits
  function updateQuizDetails(quizIdx, questionIdx, field, value, optionIdx) {
    if (field === "question") {
      quizzes[quizIdx][questionIdx].question = value;
    } else if (field === "answer") {
      quizzes[quizIdx][questionIdx].answer = value;
    } else if (field === "options") {
      quizzes[quizIdx][questionIdx].choices[optionIdx] = value;
    } else if (field === "timeLimit") {
      quizzes[quizIdx][questionIdx].timeLimit = parseInt(value, 10);
    }
    // quizzes = [...quizzes];
  }

  function downloadQuizAsCSV(idx) {
    let quiz = quizzes[idx];

    // Check if any quiz item has an imageUrl
    const hasImageUrl = quiz.some((item) => "imageUrl" in item);

    // Start with the header for the CSV file
    let csvHeader = "Question,Answer,Choice1,Choice2,Choice3,Choice4,TimeLimit";
    if (hasImageUrl) {
      csvHeader += ",ImageUrl";
    }
    let csvContent = csvHeader + "\n";

    // Iterate through each quiz question
    quiz.forEach((item) => {
      // Add the question and answer
      let row = `"${item.question}","${item.answer}"`;

      // Add the choices
      item.choices.forEach((choice) => {
        row += `,"${choice}"`;
      });

      // Add the time limit
      row += `,${item.timeLimit}`;

      // Add the image URL if it exists
      if (hasImageUrl) {
        row += `,"${item.imageUrl || ""}"`;
      }

      // Add the row to the CSV content
      csvContent += row + "\n";
    });

    // Blob and URL.createObjectURL for download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Temporary link to trigger download
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `quiz_${idx + 1}.csv`);
    document.body.appendChild(link);
    link.click();

    // Clean URL after download
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function importQuiz(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const parsedQuiz = parseCSVToQuiz(content);
        console.log("Parsed: \n");
        console.log(parsedQuiz);

        //save to quizzes
        quizzes.push(parsedQuiz);
        //force svelte to update
        quizzes = [...quizzes];

        // displayQuiz(
        //   quizzes[quizzes.length - parsedQuiz.length],
        //   quizzes.length - parsedQuiz.length
        // );
      };
      reader.readAsText(file);
    }
  }

  const logout = async () => {
    try {
      // Call the logout method from your authentication service
      //await authService.logout();

      // Redirect to the login page or any other desired page after logout
      goto("/signIn");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  function parseCSVToQuiz(csvData) {
    // Split the CSV data into lines
    const lines = csvData.trim().split("\n");

    // Remove the header line
    lines.shift();

    // Map each line to a quiz question object
    const quiz = lines.map((line) => {
      // Split the line by commas, considering quotes
      const [
        question,
        answer,
        choice1,
        choice2,
        choice3,
        choice4,
        timeLimit,
        imageUrl,
      ] = line
        .match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
        .map((field) => field.replace(/(^"|"$)/g, ""));

      return {
        question,
        answer,
        choices: [choice1, choice2, choice3, choice4],
        timeLimit: parseInt(timeLimit),
        imageUrl: imageUrl || null,
      };
    });

    // If imgUrl is null, remove it
    quiz.forEach((item) => {
      if (item.imageUrl === null) {
        delete item.imageUrl;
      }
    });

    return quiz;
  }
</script>

<nav>
  <div class="logo">JAM</div>
  <div class="logo">{ $user.userName }</div>
  <ul>
    <li><button class="nav_button" on:click={() => goto("/")}>Home</button></li>
    <li>
      <button class="nav_button" on:click={() => goto("/viewHistory")}
        >History</button
      >
    </li>
    {#if $user.isHost}
      <!-- Show Host Settings button only if the user is a host -->
      <li>
        <button class="nav_button" on:click={openHostSettingsModal}
          >Host Settings</button
        >
      </li>
    {/if}
    <li><button class="nav_button" on:click={logout}>Logout</button></li>
  </ul>
</nav>

<main>
  <body>
    <h2 class="create-quiz" style="margin-top: 60px">Choose Quiz</h2>
    {#if displayQuizCheck}
      <h5>SCROLL DOWN TO VIEW</h5>
    {/if}

    <div class="container">
      <div id="inside-box">
        {#if quizzes}
          {#each quizzes as quiz, idx}
            <button
              class="btn btn-primary btn-block"
              id="quizNo"
              on:click={() => displayQuiz(quiz, idx)}>Quiz {idx + 1}</button
            >
          {/each}
        {/if}

        <label for="inputQuiz" class="file-upload-btn">Upload Quiz CSV</label>
        <input type="file" accept=".csv" on:change={importQuiz} id="inputQuiz" class="file-input"/>

        {#if isQuizSelected}
          <button
            class="btn btn-primary btn-block"
            id="quizNo"
            on:click={() => goto("/createRoom")}>Proceed</button
          >
        {/if}

        <button
          class="btn btn-secondary btn-block"
          id="goBack"
          on:click={() => {
            goto("/hostOrPlayer");
          }}>Go back</button
        >
      </div>
    </div>

    <div class="quiz-editor">
      {#if displayQuizCheck}
        <h2>Choose or edit the quiz</h2>
        {#each quizToDisplay as question, qIdx}
          <div class="question-block">
            <input
              class="question-input"
              type="text"
              bind:value={question.question}
              on:input={(e) =>
                updateQuizDetails(quizIdx, qIdx, "question", e.target.value)}
            />

            <div class="answer-block">
              <label class="answer-label" for={`answer-${qIdx}`}>Answer:</label>
              <input
                class="answer-input"
                type="text"
                bind:value={question.answer}
                on:input={(e) =>
                  updateQuizDetails(quizIdx, qIdx, "answer", e.target.value)}
              />
            </div>

            <div class="options-block">
              {#each question.options as option, oIdx}
                <div class="option-item">
                  <label class="option-label" for={`option-${qIdx}-${oIdx}`}
                    >Option {oIdx + 1}:</label
                  >
                  <input
                    class="option-input"
                    type="text"
                    bind:value={option}
                    on:input={(e) =>
                      updateQuizDetails(
                        quizIdx,
                        qIdx,
                        "options",
                        e.target.value,
                        oIdx
                      )}
                  />
                </div>
              {/each}
            </div>

            <div class="time-limit-block">
              <label class="time-limit-label" for={`timeLimit-${qIdx}`}
                >Time Limit:</label
              >
              <input
                class="time-limit-input"
                type="number"
                bind:value={question.timeLimit}
                on:input={(e) =>
                  updateQuizDetails(quizIdx, qIdx, "timeLimit", e.target.value)}
              />
            </div>
          </div>
        {/each}
        <button class="btn btn-tertiary" on:click={() => chooseQuiz()}
          >Choose</button
        >

        <button
          class="btn btn-tertiary"
          on:click={() => downloadQuizAsCSV(quizIdx)}>Download</button
        >
        <button class="btn btn-secondary" on:click={() => closeQuiz()}
          >Close</button
        >
      {/if}
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
  nav {
    background-color: #690092; /* Purple background color */
    padding: 0.5rem 1rem; /* Padding around the navbar */
    position: fixed; /* Fix the position at the top */
    width: 100%; /* Full width */
    top: 0; /* Position at the top of the page */
    z-index: 1000; /* Stack above other content */
    display: flex; /* Use flexbox for positioning */
    justify-content: space-between; /* Space between items */
    align-items: center; /* Center items vertically */
  }

  ul {
    list-style: none; /* Remove list styling */
    display: flex; /* Display as flex for inline positioning */
    margin: 0;
    padding: 0;
    align-items: center; /* Center items vertically */
  }

  .logo {
    flex-grow: 1; /* Allows the logo to grow and push the nav buttons to the right */
    color: #c49eff; /* Logo text color */
    font-size: 1.5rem; /* Logo text size */
    font-weight: bold;
    margin-left: 2rem;
  }

  .nav_button {
    background-color: transparent; /* Transparent button background */
    color: #c49eff; /* Button text color */
    padding: 0.5rem 1rem; /* Padding inside buttons */
    border: none; /* No border for buttons */
    text-align: center; /* Center the text inside buttons */
    text-decoration: none; /* No underline */
    font-size: 1rem; /* Button text size */
    cursor: pointer; /* Pointer cursor on hover */
    border-radius: 0.25rem; /* Slightly rounded corners for buttons */
    transition: color 0.3s ease, background-color 0.3s ease; /* Transition effect for hover */
  }

  .nav_button:hover {
    background-color: #c49eff; /* Button background color on hover */
    color: #690092; /* Button text color on hover */
  }

  .file-upload-btn {
    display: inline-block;
    padding: 10px 25px;
    color: white;
    background-color: #6a27ce;  
    border-radius: 12px;
    cursor: pointer;
    font-family: 'JejuGothic', sans-serif;
    font-size: 18px;
    margin-top: 20px;
    margin-left: 20px; /* Adjust this as necessary to align with other elements */
  }

  .file-input {
    opacity: 0; /* Hide the actual input field */
    position: absolute;
    z-index: -1;
  }

  /* Adjustments for mobile screens */
  @media (max-width: 768px) {
    .nav_button {
      padding: 0.5rem; /* Smaller padding on mobile */
      font-size: 0.875rem; /* Smaller text on mobile */
    }
  }

  .container {
    width: 20rem;
    height: 26rem;
    background: #c49eff;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
    border-radius: 51px;
    padding: 2rem;
    margin: 1rem auto;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .create-quiz,
  h5,
  #quizChosen p,
  .quiz-editor h2 {
    color: red;
    text-align: center;
  }

  #inside-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around; /* This will space out your items evenly */
  }
  .btn {
    margin-right: 6rem;
    width: 12rem;
    border: None;
    font-family: JejuGothic, sans-serif;
    border-radius: 12px;
    height: 2.76rem;
    font-size: 20px;
  }
  .btn-tertiary:active {
    background-color: #005550;
    color: #f0e9e9;
    border: None;
  }
  .btn-primary {
    background: #00a59b;
    border: None;
    font-size: 20px;
    color: white;
    font-family: JejuGothic, sans-serif;
  }
  #quizNo {
    margin-top: 0.75rem;
    margin-left: 7.5rem;
  }
  .btn-secondary {
    background: #c70000;
    border: None;
    margin-top: 1.5rem;
    margin-left: 6.75rem;
    font-size: 20px;
    color: white;
    width: 6.5rem;
    font-family: JejuGothic, sans-serif;
  }
  .btn-secondary:active {
    background-color: #850101;
    color: white;
    border: None;
  }
  h2 {
    color: white;
    font-family: JejuGothic, sans-serif;
    font-size: 45px;
    margin-left: 29rem;
    margin-top: 2rem;
  }
  .create-quiz {
    color: white;
    font-family: 'JejuGothic', sans-serif;
    font-size: 36px; /* Adjust the font size as needed */
    text-align: center;
    margin-top: 60px; /* Adjust the top margin to fit your design */
  }
  h5 {
    color: rgb(216, 53, 53);
    font-family: JejuGothic, sans-serif;
    text-align: center;
  }
  .btn-tertiary {
    background: #00a59b;
    border: None;
    margin-top: 1rem;
    margin-left: 4.5rem;
    font-size: 20px;
    color: white;
    width: 12rem;
    font-family: JejuGothic, sans-serif;
  }
  #quizChosen {
    color: rgb(216, 53, 53);
    font-family: JejuGothic, sans-serif;
    margin-left: 39.5rem;
  }

  .question-block {
    margin-bottom: 20px;
  }

  .answer-block,
  .options-block,
  .time-limit-block {
    margin-top: 10px;
  }

  .option-item {
    margin-top: 5px;
  }

  .question-input {
    display: block;
    width: 80rem;
    margin-bottom: 5px;
    height: 2rem;
    padding-left: 1rem;
    font-size: 20px;
    font-family: JejuGothic, sans-serif;
    font-size: 20px;
    color: #7801a8;
    background: white;
    border-radius: 12rem;
  }
  .answer-input {
    display: block;
    width: 10rem;
    margin-bottom: 5px;
    margin-top: 1rem;
    text-align: center;
    padding-left: -3rem;
    color: #c49eff;
    font-family: JejuGothic, sans-serif;
    font-size: 15px;
    border-radius: 12rem;
  }
  .option-input {
    display: block;
    width: 10rem;
    margin-bottom: 5px;
    font-family: JejuGothic, sans-serif;
    font-size: 15px;
    border-radius: 12rem;
    padding-left: 1rem;
    color: #7801a8;
  }

  .time-limit-input {
    color: red;
    font-family: JejuGothic, sans-serif;
    border-radius: 5rem;
    text-align: center;
  }
  .answer-label {
    display: block;
    margin-top: 10px;
    padding-top: 0.5rem;
    font-family: JejuGothic, sans-serif;
  }
  .option-label,
  .time-limit-label {
    display: block;
    margin-top: 10px;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    font-family: JejuGothic, sans-serif;
  }
  #inputQuiz {
    margin-left: 7.5rem;
    margin-top: 2rem;
  }

  @media screen and (max-width: 768px) {
    .btn {
      padding: 5px;
      font-size: 14px;
    }
    .nav_button {
      margin: 4px 20px; /* Adjusted margin for larger screens */
    }

    .create-quiz {
      font-size: 30px;
      margin-left: 5rem;
      display: flex;
      justify-content: center;
    }

    h5 {
      margin-left: 5rem;
      display: flex;
      justify-content: center;
    }
    .question-input {
      margin-left: 12%;
    }

    h2 {
      color: red;
      font-size: 1.25rem;
      text-align: center;
      display: flex;
      justify-content: center;
      width: 80%;
      margin-top: 2%;
      margin-left: 14%;
    }
    .question-input,
    .answer-block,
    .options-block,
    .time-limit-block {
      width: 120%;
      margin-left: 8%;
    }
  }
  button {
    background-color: #ccc;
    border: none;
    color: white;
    padding: 5px 25px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 25px;
    margin: 4px 140px;
    cursor: pointer;
    border-radius: 5px;
    transition: all 0.3s ease;
    font-family: JejuGothic, sans-serif;
  }
  button:hover {
    background-color: #6a27ce;
  }

  

  @media screen and (min-width: 769px) {
    .btn {
      padding: 10px;
      font-size: 18px;
    }
    .nav_button {
      margin: 4px 20px; /* Adjusted margin for larger screens */
    }
    h2 {
      color: red;
      font-size: 2rem;
      margin-left: 1rem;
    }
  }
  @media (max-width: 768px) {
    .container, #inside-box, .quiz-editor {
        width: 90%; /* Take up most of the screen on smaller devices */
        margin: 0 auto; /* Center the containers */
    }
    input,
    button {
      padding: 10px;
      font-size: 14px;
      border-radius: 10px;
    }
    .nav_button {
      margin: 4px 20px; /* Adjusted margin for larger screens */
    }
  }
  @media (min-width: 769px) {
    button {
      padding: 10px 25px;
      font-size: 18px;
      border-radius: 20px;
    }
    .nav_button {
      margin: 4px 20px; /* Adjusted margin for larger screens */
    }
  }

</style>
