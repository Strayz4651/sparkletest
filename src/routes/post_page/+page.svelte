<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { profilePicture, profileName, currentUserEmail } from '$lib/profileStore';

  

  let isClient = false;
  let post = null;
  let comments = [];
  let commentText = '';
  let liked = false;
  const POSTS_KEY = 'postedImages';

  let myParameter = null;
  function beforeUpdate() {
    myParameter = $page.url.searchParams.get('my-parameter');
  }

  function getUrlPostId() {
    return $page.url.searchParams.get('postId');
  }


  function goHome() {
    goto(resolve('/home'));
  }

  function openProfile() {
    goto(resolve('/profile_page'));
  }


  function loadPosts() {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
      const stored = window.localStorage.getItem(POSTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  function savePosts(postsArray) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(POSTS_KEY, JSON.stringify(postsArray));
    } catch (error) {
      // ignore
    }
  }

  function loadPost() {
    const postId = getUrlPostId();
    if (!postId) return;
    const posts = loadPosts();
    const found = posts.find((item) => item.id === postId);
    if (found) {
      post = found;
      comments = Array.isArray(found.comments) ? [...found.comments] : [];
      liked = false;
    }
  }

  function viewUserProfile(email) {
    if (!email) return;
    goto(resolve(`/view_profile?email=${encodeURIComponent(email)}`));
  }

  function toggleLike() {
    liked = !liked;
  }

  function getDownloadExtension(src) {
    if (typeof src === 'string' && src.startsWith('data:image/gif')) {
      return 'gif';
    }
    return 'png';
  }

  function downloadPostImage() {
    if (!post?.src) return;
    const link = document.createElement('a');
    link.href = post.src;
    link.download = `${post.name || 'post'}.${getDownloadExtension(post.src)}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function addComment() {
    const text = commentText.trim();
    if (!text || !post) return;
    const comment = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      text,
      userEmail: $currentUserEmail || '',
      userName: $profileName || 'Guest',
      userProfilePicture: $profilePicture || '/pink skull.png',
      createdAt: Date.now()
    };
    comments = [comment, ...comments];
    post = { ...post, comments };
    const posts = loadPosts();
    const updated = posts.map((item) => (item.id === post.id ? post : item));
    savePosts(updated);
    commentText = '';
  }

  function handleCommentKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addComment();
    }
  }

  onMount(() => {
    isClient = true;
    loadPost();
  });
</script>

<style>
  :global(body) {
    margin: 0;
    overflow: hidden;
    background: #000000;
  }

  .container {
    width: 100%;
    height: 100vh;
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 25px;
    box-sizing: border-box;
    background-image: linear-gradient(rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.9)), url('/background.jpg');
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
  }

  /* ---------------- TOP AREA ---------------- */

  .top-bar {
    width: 100%;

    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    margin-bottom: 10px;
  }

  .back {
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: bold;
    font-size: 22px;
    cursor: pointer;
    user-select: none;
    color: white;
    background: transparent;
    font-family: inherit;
    border: none;
  }

  .back:focus {
    outline: none;
  }

  .arrow {
    font-size: 58px;
    line-height: 1;
  }

  .top-right-container {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .top-right-box {
    position: relative;
    width: 100px;
    height: 100px;
    border: 7px solid #9f3b5a;
    background: #000000;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .top-right-box img {
    width: 120%;
    height: 100%;
    object-fit: cover;
    cursor: pointer;
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

  /* ---------------- MAIN CONTENT ---------------- */

  .main {
    flex: 1;

    display: flex;
    gap: 18px;

    overflow: hidden;
  }

  /* ---------------- LEFT PANEL ---------------- */

  .left-panel {
    width: 50%;
    height: 100%;

    border: 7px solid #9f3b5a;
    background: #000000;

    padding: 12px;
    box-sizing: border-box;
  }

  .image-box {
    width: 100%;
    height: 100%;

    border: 7px solid #9f3b5a;
    background: #000000;

    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .image-box img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  .empty-image {
    color: white;
    text-align: center;
    padding: 20px;
  }

  /* ---------------- RIGHT PANEL ---------------- */

  .right-panel {
    width: 50%;
    height: 100%;

    border: 7px solid #9f3b5a;
    background: #000000;

    display: flex;
    flex-direction: column;

    overflow: hidden;
  }

  /* ---------------- ICON BAR ---------------- */

  .icon-bar {
    width: 100%;
    height: 105px;

    border-bottom: 7px solid #9f3b5a;

    display: flex;
    align-items: center;

    padding: 0 25px;
    box-sizing: border-box;

    gap: 28px;

    flex-shrink: 0;
  }

  .heart {
    font-size: 78px;
    line-height: 1;
    color: #9f3b5a;
  }

  .download-box {
    width: 78px;
    height: 78px;
    color: #9f3b5a;
    border: 6px solid #9f3b5a;

    display: flex;
    align-items: center;
    justify-content: center;

    font-size: 56px;
    line-height: 1;
    cursor: pointer;
    background: transparent;
  }

  .created-by {
    color: white;
    font-size: 14px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
    text-align: left;
  }

  .created-by button {
    background: transparent;
    border: none;
    color: #9f3b5a;
    padding: 0;
    margin: 0;
    cursor: pointer;
    font-weight: bold;
    text-align: left;
  }

  .created-by button:hover {
    text-decoration: underline;
  }

  .dots {
    font-size: 70px;
    line-height: 1;
    color: #9f3b5a;
    margin-bottom: 18px;
  }

  /* ---------------- CONTENT AREA ---------------- */

  .content-area {
    flex: 1;
    position: relative;
  }

  .comments-list {
    position: absolute;
    top: 20px;
    left: 20px;
    right: 20px;
    bottom: 110px;
    border: 7px solid #9f3b5a;
    background: #000000;
    padding: 18px;
    box-sizing: border-box;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .comment-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    border: 1px solid rgba(159, 59, 90, 0.5);
    background: rgba(255, 255, 255, 0.04);
  }

  .comment-meta {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .comment-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    border: 2px solid #9f3b5a;
    background: #000;
  }

  .comment-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .comment-user {
    background: transparent;
    border: none;
    color: #9f3b5a;
    font-weight: bold;
    cursor: pointer;
    text-align: left;
    padding: 0;
    margin: 0;
  }

  .comment-user:hover {
    text-decoration: underline;
  }

  .comment-text {
    color: white;
    line-height: 1.4;
  }

  .comment-box {
    position: absolute;
    left: 20px;
    right: 20px;
    bottom: 20px;
    height: 80px;
    border: 7px solid #9f3b5a;
    background: #000000;
    padding: 12px;
    box-sizing: border-box;
  }

  .comment-input {
    width: 100%;
    height: 100%;
    border: none;
    outline: none;
    background: transparent;
    color: white;
    font-size: 16px;
    box-sizing: border-box;
  }

  .comment-input::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

   .logo {
    width: 300px;
    height: 130px;
    margin-top: -25px;
    position: fixed;
  }
</style>

<div class="container">
    <div style="display: flex; justify-content: center; width: 100%;">
    <img src="/sparkle logo.png" alt="Sparkle Logo" class="logo" />
  </div>

  <!-- TOP BAR -->
  <div class="top-bar">

    <!-- BACK BUTTON -->
    <button type="button" class="back" on:click={goHome}>
      <div class="arrow">⬅</div>
      <div>BACK</div>
    </button>

    <!-- TOP RIGHT BOX -->
    <div class="top-right-container">
      {#if $profileName}
        <div class="profile-name-label">{$profileName}</div>
      {/if}
      <button type="button" class="top-right-box" on:click={openProfile}>
        {#if isClient}
          <img src={$profilePicture} alt="Profile" />
        {:else}
          <div style="width:100%;height:100%;"></div>
        {/if}
      </button>
    </div>

  </div>

  <!-- MAIN CONTENT -->
  <div class="main">

    <!-- LEFT SIDE -->
    <div class="left-panel">
      <div class="image-box">
        {#if post}
          <img src={post.src} alt={post.name} />
        {:else}
          <div class="empty-image">No post selected</div>
        {/if}
      </div>
    </div>

    <!-- RIGHT SIDE -->
    <div class="right-panel">

      <!-- ICON BAR -->
      <div class="icon-bar">

        <button type="button" class="heart"  style="background: none; color: #9f3b5a; border:#9f3b5a; cursor: pointer;" on:click={toggleLike} aria-pressed={liked}>
          {liked ? '♥' : '♡'}
        </button>

        <button type="button" class="download-box" on:click={downloadPostImage} aria-label="Download image">
          ⬇
        </button>

        <div class="dots">•••</div>

        <div class="created-by">
          <span>CREATED BY</span>
          {#if post?.createdByEmail}
            <button type="button" on:click={() => viewUserProfile(post.createdByEmail)}>{post.createdByName}</button>
          {:else}
            <span>{post?.createdByName || 'Guest'}</span>
          {/if}
        </div>

      </div>

      <!-- CONTENT -->
      <div class="content-area">
        <div class="comments-list">
          {#if comments.length}
            {#each comments as comment (comment.id)}
              <div class="comment-item">
                <div class="comment-meta">
                  <div class="comment-avatar">
                    <img src={comment.userProfilePicture || '/pink skull.png'} alt={comment.userName} />
                  </div>
                  {#if comment.userEmail}
                    <button type="button" class="comment-user" on:click={() => viewUserProfile(comment.userEmail)}>{comment.userName}</button>
                  {:else}
                    <div class="comment-user">{comment.userName}</div>
                  {/if}
                </div>
                <div class="comment-text">{comment.text}</div>
              </div>
            {/each}
          {:else}
            <div class="comment-item">
              <div class="comment-text">No comments yet. Be the first to add one.</div>
            </div>
          {/if}
        </div>

        <div class="comment-box">
          <input
            type="text"
            class="comment-input"
            bind:value={commentText}
            placeholder="Write a comment and press Enter"
            on:keydown={handleCommentKeydown}
          />
        </div>
      </div>

    </div>

  </div>

</div>