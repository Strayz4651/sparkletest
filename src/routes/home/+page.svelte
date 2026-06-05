<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { profilePicture, profileName, currentUserEmail } from '$lib/profileStore';


  let otherUsers = [];
  let posts = [];
  const POSTS_KEY = 'postedImages';

  function goToEditor() {
    goto(resolve('/editing_page'));
  }

  function goToProfile() {
    goto(resolve('/profile_page'));
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

  function loadPosts() {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
      const stored = window.localStorage.getItem(POSTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  function viewUserProfile(email) {
    goto(resolve(`/view_profile?email=${encodeURIComponent(email)}`));
  }

  function openPost(postId) {
    goto(resolve(`/post_page?postId=${encodeURIComponent(postId)}`));
  }

  onMount(() => {
    const users = getRegisteredUsers();
    // Filter out the current user and only show users with a name set
    otherUsers = users.filter(
      (user) => user.email !== $currentUserEmail && user.name && user.name.trim()
    );
    posts = loadPosts();
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
    align-items: center;
    justify-content: flex-start;
    background-image: linear-gradient(rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.9)), url('/background.jpg');
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
  }

  .top-bar {
    width: 100%;
    display: flex;
    justify-content: flex-start; 
    position: relative;
    margin-top: 25px;
    padding-left: 35px;
    box-sizing: border-box;
  }

  .make-box {
    border: 7px solid #9f3b5a;
    padding: 20px 55px;
    font-weight: bold;
    background: #000000;
    cursor: pointer;
    color: white;
    background-color: transparent;
    border: 7px solid #9f3b5a;
    font-family: inherit;
  }

  .top-right-container {
    position: absolute;
    right: 10px;
    top: -10px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .top-right-box {
    width: 100px;
    height: 100px;
    border: 7px solid #9f3b5a;
    background: #000000;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .top-right-box img {
    width: 120%;
    height: 100%;
    object-fit: cover;
  }

  .main {
    display: flex;
    width: 95%;
    margin-top: 40px;
    justify-content: space-between;
    height: 75vh;
  }

  .left-panel {
    width: 18%;
    display: flex;
    color: white;
    flex-direction: column;
    align-items: center;
    height: 100%;
  }

  .right-panel {
    width: 18%;
    display: flex;
    color: white;
    flex-direction: column;
    align-items: center;
    height: 100%;
  }

  .label {
    margin-bottom: 10px;
    font-weight: bold;
  }

  .box {
    width: 100%;
    height: 100%;
    border: 7px #9f3b5a solid;
    background: #000000;
    padding: 10px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .inner-box {
    width: 100%;
    height: 100%;
    border: 7px solid #9f3b5a;
    background: #000000;
    padding: 10px;
    box-sizing: border-box;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    overflow-y: auto;
    /* hide native scrollbars but keep scrolling functional */
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }

  .inner-box::-webkit-scrollbar {
    display: none; /* Safari and Chrome */
    width: 0;
    height: 0;
  }

  .posts-row {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 18px;
    width: 100%;
    height: 100%;
    padding: 8px;
    box-sizing: border-box;
    align-items: start;
    grid-auto-rows: auto;
  }

  .post-item {
    width: 100%;
    min-height: 200px;
    background: #111;
    border: 4px solid #9f3b5a;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: white;
    text-align: left;
    padding: 0;
    border-radius: 2px;
    cursor: pointer;
  }

  .post-item:hover,
  .post-item:focus {
    filter: brightness(1.05);
  }

  .post-item img {
    width: 100%;
    height: 140px;
    object-fit: contain;
    background: #000;
  }

  .post-name {
    padding: 10px;
    color: white;
    background: #000;
    text-align: center;
    font-weight: bold;
    border-top: 1px solid rgba(159, 59, 90, 0.5);
  }

  .empty-message {
    color: white;
    text-align: center;
    width: 100%;
    padding: 20px;
  }

  .center-panel {
    width: 60%;
    height: 101%;
    border: 7px solid #9f3b5a;
    background: #000000;
    padding: 10px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo {
    width: 300px;
    height: 130px;
    margin-top: 0px;
    position: fixed;
  }

  .profile-name-label {
    color: white;
    font-weight: bold;
    font-size: 14px;
    text-shadow: 0 0 12px rgba(0, 0, 0, 0.8);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
    pointer-events: none;
  }

  .users-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
    height: 100%;
    overflow-y: auto;
    padding: 10px;
    box-sizing: border-box;
    /* hide native scrollbars but keep scrolling functional */
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }

  .users-container::-webkit-scrollbar {
    display: none; /* Safari and Chrome */
    width: 0;
    height: 0;
  }

  .users-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
    height: 100%;
    overflow-y: auto;
    padding: 10px;
  }

  .user-item {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    padding: 8px;
    border-radius: 4px;
    transition: background-color 0.2s;
    background-color:rgba(173, 66, 100, 0.2);
  }

  .user-item:hover {
    background-color: rgba(159, 59, 90, 0.2);
  }

  .user-picture {
    width: 50px;
    height: 50px;
    border: 4px solid #9f3b5a;
    background: #000000;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
  }

  .user-picture img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .user-name {
    color: white;
    font-weight: bold;
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

</style>

<div class="container">
  <div style="display: flex; justify-content: center; width: 100%;">
    <img src="/sparkle logo.png" alt="Sparkle Logo" class="logo" />
  </div>

  <div class="top-bar">

   
    <button type="button" class="make-box" on:click={goToEditor}>
      MAKE YOUR OWN!
    </button>

    
    <div class="top-right-container">
      {#if $profileName}
        <div class="profile-name-label">{$profileName}</div>
      {/if}
      <button type="button" class="top-right-box" on:click={goToProfile}>
        <img src={$profilePicture} alt="Profile" />
      </button>
    </div>

  </div>

  <div class="main">

    <div class="left-panel">
      <div class="label">NEWS</div>
      <div class="box">
        <div class="inner-box"></div>
      </div>
    </div>

    <div class="center-panel">
      <div class="inner-box">
        {#if posts.length}
          <div class="posts-row">
            {#each posts as post (post.id)}
              <button type="button" class="post-item" on:click={() => openPost(post.id)}>
                <img src={post.src} alt={post.name} />
                <div class="post-name">{post.name}</div>
              </button>
            {/each}
          </div>
        {:else}
          <div class="empty-message">No posted images yet. Create one using MAKE YOUR OWN!</div>
        {/if}
      </div>
    </div>

    <div class="right-panel">
      <div class="label">FIND OTHERS</div>
      <div class="box">
        <div class="users-container">
          {#each otherUsers as user (user.email)}
            <button
              type="button"
              class="user-item"
              on:click={() => viewUserProfile(user.email)}
            >
              <div class="user-picture">
                <img src={user.profilePicture || '/pink skull.png'} alt={user.name} />
              </div>
              <div class="user-name">{user.name}</div>
            </button>
          {/each}
          {#if otherUsers.length === 0}
            <div style="color: white; text-align: center; margin-top: 20px;">
              No other users yet
            </div>
          {/if}
        </div>
      </div>
    </div>

  </div>
</div>