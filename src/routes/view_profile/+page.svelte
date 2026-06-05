<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  export function load() {
	  redirect(307, resolve(base+'/home'));
  }

  let userData = {
    profilePicture: '/pink skull.png',
    name: '',
    about: ''
  };

  function goHome() {
    goto('/home');
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

  function loadUserData(email) {
    if (!email) return;
    const users = getRegisteredUsers();
    const user = users.find((u) => u.email === email);
    if (user) {
      userData = {
        profilePicture: user.profilePicture || '/pink skull.png',
        name: user.name || '',
        about: user.about || ''
      };
    }
  }

  onMount(() => {
    const email = $page.url.searchParams.get('email');
    if (email) {
      loadUserData(email);
    }
  });
  
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

  .button-row {
    display: flex;
    gap: 16px;
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

  .name-text {
    font-family: 'Times New Roman', Times, serif;
    color: white;
    font-size: 28px;
    font-weight: bold;
  }

  .about-text {
    width: 100%;
    height: 100%;
    font-family: 'Times New Roman', Times, serif;
    font-size: 28px;
    font-weight: bold;
    color: white;
    overflow-y: auto;
    word-wrap: break-word;
  }

  .logo {
    width: 300px;
    height: 130px;
    margin-top: -24px;
    position: fixed;
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

    <div class="button-row"></div>
  </div>

  <div class="top-section">
    <div class="profile-pic-button">
      <img src={userData.profilePicture} alt="Profile" />
    </div>
  </div>

  <div class="middle-bar">
    <div class="name-text">{userData.name || 'Guest'}</div>
  </div>

  <div class="bottom-section">
    <div class="about-text">{userData.about || 'No bio available'}</div>
  </div>
</div>
