<script>
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { profilePicture, profileName, profileAbout, currentUserEmail } from '$lib/profileStore';

  let name = '';
  let aboutMe = '';
  let pendingProfilePicture = '';
  let fileInput;
  let showAuth = false;
  let authMode = 'register';
  let authEmail = '';
  let authPassword = '';
  let authMessage = '';
  let authError = '';



  
  const DEFAULT_PICTURE = '/pink skull.png';

  function goHome() {
      goto(resolve('/home'));  }

  function openProfilePicker() {
    if ($currentUserEmail) {
      fileInput?.click();
    }
  }

  function handleProfileFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      pendingProfilePicture = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function saveProfile() {
    if (!$currentUserEmail) return;

    if (pendingProfilePicture) {
      profilePicture.set(pendingProfilePicture);
    }

    profileName.set(name);
    profileAbout.set(aboutMe);

    try {
      const users = getRegisteredUsers();
      const user = users.find((saved) => saved.email === $currentUserEmail);
      if (user) {
        if (pendingProfilePicture) {
          user.profilePicture = pendingProfilePicture;
        }
        user.name = name;
        user.about = aboutMe;
        saveRegisteredUsers(users);
      }
    } catch (e) {
      // ignore
    }

    pendingProfilePicture = '';
  }

  function openRegister() {
    authMode = 'register';
    authEmail = '';
    authPassword = '';
    authMessage = '';
    authError = '';
    showAuth = true;
  }

  function openLogin() {
    authMode = 'login';
    authEmail = '';
    authPassword = '';
    authMessage = '';
    authError = '';
    showAuth = true;
  }

  function closeAuth() {
    showAuth = false;
    authMessage = '';
    authError = '';
  }

  function getRegisteredUsers() {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
      const stored = window.localStorage.getItem('registeredUsers');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  function saveRegisteredUsers(users) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem('registeredUsers', JSON.stringify(users));
    } catch (e) {
      // ignore
    }
  }

  function saveCurrentUser(email) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem('currentUserEmail', email);
    } catch (e) {
      // ignore
    }
  }

  function clearCurrentUser() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.removeItem('currentUserEmail');
    } catch (e) {
      // ignore
    }
  }

  function registerUser() {
    authError = '';
    authMessage = '';
    const email = authEmail.trim().toLowerCase();
    const password = authPassword;

    if (!email || !password) {
      authError = 'Please enter both email and password.';
      return;
    }

    const users = getRegisteredUsers();
    if (users.some((user) => user.email === email)) {
      authError = 'This email is already registered.';
      return;
    }

    users.push({
      email,
      password,
      profilePicture: $profilePicture,
      name: '',
      about: '',
      registeredAt: new Date().toISOString(),
    });

    saveRegisteredUsers(users);
    currentUserEmail.set(email);
    saveCurrentUser(email);
    profileName.set('');
    profileAbout.set('');
    name = '';
    aboutMe = '';
    authMessage = 'Registration successful!';
    authEmail = '';
    authPassword = '';
  }

  function loginUser() {
    authError = '';
    authMessage = '';
    const email = authEmail.trim().toLowerCase();
    const password = authPassword;

    if (!email || !password) {
      authError = 'Please enter both email and password.';
      return;
    }

    const users = getRegisteredUsers();
    const user = users.find((user) => user.email === email);

    if (!user) {
      authError = 'This email is not registered.';
      return;
    }

    if (user.password !== password) {
      authError = 'Incorrect password.';
      return;
    }

    currentUserEmail.set(email);
    saveCurrentUser(email);
    profilePicture.set(user.profilePicture || DEFAULT_PICTURE);
    profileName.set(user.name || '');
    profileAbout.set(user.about || '');
    name = user.name || '';
    aboutMe = user.about || '';
    authMessage = 'Login successful!';
    authEmail = '';
    authPassword = '';
  }

  function logoutUser() {
    currentUserEmail.set('');
    clearCurrentUser();
    profilePicture.set(DEFAULT_PICTURE);
    profileName.set('');
    profileAbout.set('');
    name = '';
    aboutMe = '';
    pendingProfilePicture = '';
    authMessage = '';
    authError = '';
  }

  onMount(() => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const userEmail = window.localStorage.getItem('currentUserEmail');
      if (userEmail) {
        const users = getRegisteredUsers();
        const user = users.find((saved) => saved.email === userEmail);
        if (user) {
          currentUserEmail.set(userEmail);
          profilePicture.set(user.profilePicture || DEFAULT_PICTURE);
          profileName.set(user.name || '');
          profileAbout.set(user.about || '');
          name = user.name || '';
          aboutMe = user.about || '';
        }
      }
    } catch (e) {
      // ignore
    }
  });

  $: displayedProfilePicture = pendingProfilePicture || $profilePicture;
</script>

<style>
  :global(body) {
    margin: 0;
    overflow: hidden;
  }

  .container {
    width: 100%;
    height: 100vh;
    background: #000000;

    display: flex;
    flex-direction: column;

    padding: 24px;
    box-sizing: border-box;
    gap: 24px;
  }


  .top-bar {
    width: 100%;

    display: flex;
    justify-content: space-between;
    align-items: center;

    flex-shrink: 0;
  }


  .back {
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: bold;
    font-size: 22px;
    color: white;
    cursor: pointer;
    user-select: none;
    border: none;
    background: transparent;
    padding: 0;
    font-family: inherit;
  }

  .arrow {
    font-size: 58px;
    line-height: 1;
  }


  .save-box {
    width: 140px;
    height: 65px;
    border: 7px solid #9f3b5a;
    background: #000000;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;

    font-weight: bold;
    font-size: 22px;

    user-select: none;
    cursor: pointer;
    border-radius: 0;
    outline: none;
    appearance: none;
    text-transform: uppercase;
  }

  .save-box:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .button-row {
    display: flex;
    gap: 16px;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    z-index: 10;
  }

  .modal {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(520px, 90vw);
    border: 7px solid #9f3b5a;
    background: #000000;
    padding: 28px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 18px;
    z-index: 11;
  }

  .modal-header {
    font-size: 28px;
    font-weight: bold;
    color: white;
    text-align: center;
  }

  .modal-input {
    width: 100%;
    border: 7px solid #9f3b5a;
    background: transparent;
    color: white;
    padding: 18px;
    box-sizing: border-box;
    outline: none;
    font-size: 18px;
  }

  .modal-row {
    display: flex;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .modal-error,
  .modal-success {
    text-align: center;
    font-weight: bold;
  }

  .modal-error {
    color: #ff5a5a;
  }

  .modal-success {
    color: #80ff80;
  }

  .top-section {
    width: 100%;
    height: 35%;

    border: 7px solid #9f3b5a;
    background: #000000;

    display: flex;
    align-items: center;

    padding: 28px;
    box-sizing: border-box;

    flex-shrink: 0;
  }

  .profile-pic-button {
    width: 190px;
    height: 190px;
    border: 7px solid #9f3b5a;
    background: #000000;
    display: block;
    padding: 0;
    flex-shrink: 0;
    cursor: pointer;
    border-radius: 0;
    outline: none;
  }

  .profile-pic-button img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }


  .middle-bar {
    width: 32%;
    height: 70px;

    border: 7px solid #9f3b5a;
    background: #000000;

    padding: 0 18px;
    box-sizing: border-box;

    display: flex;
    align-items: center;

    flex-shrink: 0;
  }

  .bottom-section {
    flex: 1;

    width: 100%;

    border: 7px solid #9f3b5a;
    background: #000000;

    padding: 20px;
    box-sizing: border-box;

    min-height: 0;
  }


  .name-input {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    font-family: 'Times New Roman', Times, serif;
    color: white;
    font-size: 28px;
    font-weight: bold;
  }

  .about-input {
    width: 100%;
    height: 100%;
    border: none;
    outline: none;
    resize: none;
    background: transparent;
    font-family: 'Times New Roman', Times, serif;
    font-size: 28px;
    font-weight: bold;
    color: white;
  }

  .logo {
    width: 300px;
    height: 130px;
    margin-top: -24px;
    position: fixed;
  }


  .name-input::placeholder,
  .about-input::placeholder {
    color: rgba(255, 255, 255, 0.622);
  }
</style>

<div class="container">
  <div style="display: flex; justify-content: center; width: 100%;">
    <img src="/sparkle logo.png" alt="Sparkle Logo" class="logo" />
</div>
  <div class="top-bar">

    <button type="button" class="back" on:click={goHome}>
      <div class="arrow">⬅</div>
      <div>BACK</div>
    </button>

    <div class="button-row">
      <button type="button" class="save-box" on:click={saveProfile} disabled={!$currentUserEmail}>
        SAVE
      </button>
      <button type="button" class="save-box" on:click={openRegister}>
        REGISTER
      </button>
      {#if !$currentUserEmail}
        <button type="button" class="save-box" on:click={openLogin}>
          LOGIN
        </button>
      {/if}
      {#if $currentUserEmail}
        <button type="button" class="save-box" on:click={logoutUser}>
          LOGOUT
        </button>
      {/if}
    </div>

  </div>

  <input
    type="file"
    accept="image/*"
    bind:this={fileInput}
    on:change={handleProfileFile}
    style="display: none"
  />

  <div class="top-section">
    <button type="button" class="profile-pic-button" on:click={openProfilePicker} disabled={!$currentUserEmail}>
      <img src={displayedProfilePicture} alt="Profile" />
    </button>
  </div>

  <div class="middle-bar">
    <input
      class="name-input"
      type="text"
      bind:value={name}
      placeholder="Name..."
      disabled={!$currentUserEmail}
    />
  </div>

  
  <div class="bottom-section">
    <textarea
      class="about-input"
      bind:value={aboutMe}
      placeholder="About me..."
      disabled={!$currentUserEmail}
    ></textarea>
  </div>

  {#if showAuth}
    <div
      class="modal-backdrop"
      role="button"
      tabindex="0"
      on:click={closeAuth}
      on:keydown={(event) => event.key === 'Enter' && closeAuth()}
    ></div>
    <div class="modal">
      <div class="modal-header">{authMode === 'login' ? 'LOGIN' : 'REGISTER'}</div>
      <input
        class="modal-input"
        type="email"
        bind:value={authEmail}
        placeholder="Email"
      />
      <input
        class="modal-input"
        type="password"
        bind:value={authPassword}
        placeholder="Password"
      />
      <div class="modal-row">
        <button
          type="button"
          class="save-box"
          on:click={authMode === 'login' ? loginUser : registerUser}
        >
          {authMode === 'login' ? 'LOGIN' : 'REGISTER'}
        </button>
        <button type="button" class="save-box" on:click={closeAuth}>
          CANCEL
        </button>
      </div>
      {#if authError}
        <div class="modal-error">{authError}</div>
      {/if}
      {#if authMessage}
        <div class="modal-success">{authMessage}</div>
      {/if}
    </div>
  {/if}

</div>