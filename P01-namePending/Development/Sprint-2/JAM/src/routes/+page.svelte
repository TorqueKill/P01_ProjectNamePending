<script lang="js">
  import { goto } from "$app/navigation";

  let signupVisible = false;
  let signinVisible = false;

  function toggleSignup() {
    // signupVisible = !signupVisible;
    // signinVisible = false;
    goto("/signUp");
  }

  function toggleSignin() {
    goto("/signIn");
    // signinVisible = !signinVisible;
    // signupVisible = false;
  }
</script>

<main>
  <body>
    <div class="landing-page">
      <h1>Welcome to JAM!</h1>
      <!-- <p>A brief description of your app and its benefits.</p> -->

      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <div class="buttons">
        <button on:click={toggleSignup}>Sign Up</button>
        <button on:click={toggleSignin}>Sign In</button>
        <button
          on:click={() => {
            goto("/hostOrPlayer");
          }}>Annonymous</button
        >
      </div>

      {#if signupVisible}
        <div class="signup-form" />
      {/if}

      {#if signinVisible}
        <div class="signin-form" />
      {/if}
    </div>
  </body>
</main>

<style>
  .landing-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    font-family: JejuGothic, sans-serif;
  }
  body {
    background: #7801a8;
  }
  h1 {
    color: #c49eff;
  }

  .buttons {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 2rem;
    border-radius: 20rem;
  }

  .signup-form,
  .signin-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-family: JejuGothic, sans-serif;
  }
  .landing-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    font-family: JejuGothic, sans-serif;
  }

  @media (max-width: 768px) {
    .buttons {
      flex-direction: column;
    }

    .landing-page {
      padding: 0 20px;
      font-family: JejuGothic, sans-serif;
    }
  }

  @media (min-width: 769px) {
    .buttons button {
      padding: 10px 20px;
      font-size: 1rem;
      border-radius: 20rem;
      border: None;
      font-family: JejuGothic, sans-serif;
    }
  }
</style>
