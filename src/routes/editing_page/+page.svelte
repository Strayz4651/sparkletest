<script>
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { profilePicture, profileName, currentUserEmail } from '$lib/profileStore';

  const stickers = [
    '/skull1.png', '/skull2.png', '/skull3.png', '/skull4.png', '/skull5.png', '/skull6.png', '/skull7.png', '/skull8.png', '/skull9.png', '/skull10.png', '/skull11.png', '/skull12.png', '/skull13.png', '/skull14.png',
    '/sparkle1.png', '/sparkle2.png', '/sparkle3.png', '/sparkle4.png', '/sparkle5.png', '/sparkle6.png', '/sparkle7.png', '/sparkle8.png',
    '/heart1.png', '/heart2.png', '/heart3.png', '/heart4.png', '/heart5.png', '/heart6.png', '/heart7.png', '/heart8.png', '/heart9.png', '/heart10.png', '/heart11.png',
    '/cat1.png', '/cat2.png', '/cat3.png', '/cat4.png', '/cat5.png', '/cat6.png', '/cat7.png', '/cat8.png', '/cat10.png', '/cat11.png', '/cat12.png',
    '/bow1.png', '/bow2.png', '/bow3.png', '/bow4.png', '/bow5.png', '/bow6.png', '/bow7.png', '/bow8.png', '/bow9.png'
  ];

  const overlays = [
    '/overlay1.png', '/overlay2.png', '/overlay3.png', '/overlay4.png', '/overlay5.png', '/overlay6.png', '/overlay7.png', '/overlay8.png', '/overlay9.png', '/overlay10.png'
  ];

  const handleVectors = {
    tl: { x: -1, y: -1 },
    tr: { x: 1, y: -1 },
    bl: { x: -1, y: 1 },
    br: { x: 1, y: 1 },
    top: { x: 0, y: -1 },
    bottom: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };

  function shuffle(array) {
    return [...array].sort(() => Math.random() - 0.5);
  }


  let fileInput;
  let imageSrc = '';
  let layers = [];
  let selectedLayerId = null;
  let activePanel = 'stickers';
  let assetItems = shuffle(stickers);
  let dragging = false;
  let dragStart = { x: 0, y: 0 };
  let originPos = { x: 0, y: 0 };
  let resizing = false;
  let rotating = false;
  let activeHandle = null;
  let handleStart = { x: 0, y: 0 };
  let initialScaleX = 1;
  let initialScaleY = 1;
  let initialRotate = 0;
  let initialPos = { x: 0, y: 0 };
  let canvasEl;
  let history = [];
  let historyIndex = -1;
  let unsaved = false;
  let selectedLayer = null;
  let rotateStartAngle = 0;
  let postModalOpen = false;
  let postName = '';
  let isPosting = false;

  const DRAFT_KEY_PREFIX = 'editingDraft_';
  const POSTS_KEY = 'postedImages';

  $: selectedLayer = layers.find((layer) => layer.id === selectedLayerId);

  function goHome() {
    if (unsaved) {
      const ok = confirm('You have unsaved changes. Save before leaving?');
      if (ok) {
        saveDraft();
        goto('/home');
      }
    } else {
      goto('/home');
    }
  }

  function goProfile() {
    if (unsaved) {
      const ok = confirm('You have unsaved changes. Save before leaving?');
      if (ok) {
        saveDraft();
        goto('/profile_page');
      }
    } else {
      goto('/profile_page');
    }
  }

  function getLayerTypeRank(type) {
    return type === 'overlay' ? 2 : type === 'sticker' ? 1 : 0;
  }

  function createLayer(type, src) {
    const rank = getLayerTypeRank(type);
    const countOfType = layers.filter((layer) => layer.type === type).length;
    return {
      id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type,
      src,
      scaleX: 1,
      scaleY: 1,
      rotate: 0,
      pos: { x: 0, y: 0 },
      natural: { w: 0, h: 0 },
      zIndex: 100 + rank * 100 + countOfType
    };
  }

  function updateLayer(id, patch) {
    layers = layers.map((layer) => (layer.id === id ? { ...layer, ...patch } : layer));
  }

  function selectLayer(id) {
    selectedLayerId = id;
  }

  function selectPanel(panel) {
    activePanel = panel;
    assetItems = shuffle(panel === 'stickers' ? stickers : overlays);
  }

  function addAsset(src, type) {
    pushHistory();
    const layer = createLayer(type, src);
    layers = [...layers, layer];
    selectedLayerId = layer.id;
    unsaved = true;
  }

  function openFilePicker() {
    fileInput?.click();
  }

  function isGifDataUrl(src) {
    return typeof src === 'string' && src.startsWith('data:image/gif');
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      pushHistory();
      const layer = createLayer('user', reader.result);
      layers = [...layers, layer];
      selectedLayerId = layer.id;
      unsaved = true;
      imageSrc = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function deleteSelectedLayer() {
    if (!selectedLayerId) return;
    pushHistory();
    layers = layers.filter((layer) => layer.id !== selectedLayerId);
    selectedLayerId = null;
    unsaved = true;
  }

  function pushHistory() {
    const snapshot = {
      layers: layers.map((layer) => ({
        ...layer,
        pos: { ...layer.pos },
        natural: { ...layer.natural }
      })),
      selectedLayerId
    };

    if (historyIndex < history.length - 1) history = history.slice(0, historyIndex + 1);
    history.push(snapshot);
    historyIndex = history.length - 1;
    if (history.length > 50) {
      history.shift();
      historyIndex = history.length - 1;
    }
  }

  function undo() {
    if (historyIndex <= 0) return;
    historyIndex -= 1;
    const snapshot = history[historyIndex];
    if (snapshot) {
      layers = snapshot.layers.map((layer) => ({
        ...layer,
        pos: { ...layer.pos },
        natural: { ...layer.natural }
      }));
      selectedLayerId = snapshot.selectedLayerId;
      unsaved = true;
    }
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    historyIndex += 1;
    const snapshot = history[historyIndex];
    if (snapshot) {
      layers = snapshot.layers.map((layer) => ({
        ...layer,
        pos: { ...layer.pos },
        natural: { ...layer.natural }
      }));
      selectedLayerId = snapshot.selectedLayerId;
      unsaved = true;
    }
  }

  function onPointerDown(e, layer) {
    if (!layer) return;
    e.preventDefault();
    selectLayer(layer.id);
    dragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
    originPos = { ...layer.pos };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e) {
    if (!dragging || !selectedLayer) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    updateLayer(selectedLayer.id, { pos: { x: originPos.x + dx, y: originPos.y + dy } });
  }

  function onPointerUp() {
    if (!dragging) return;
    dragging = false;
    pushHistory();
    unsaved = true;
  }

  function saveDraft() {
    const key = DRAFT_KEY_PREFIX + ($currentUserEmail || 'guest');
    const payload = { layers };
    try {
      window.localStorage.setItem(key, JSON.stringify(payload));
      unsaved = false;
    } catch (error) {
      // ignore
    }
  }

  function openPostModal() {
    if (!layers.length) {
      alert('Upload an image or add a sticker/overlay before posting.');
      return;
    }
    postName = '';
    postModalOpen = true;
  }

  function closePostModal() {
    postModalOpen = false;
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

 async function createCompositeDataUrl() {
  if (layers.length === 1 && layers[0].type === 'user' && isGifDataUrl(layers[0].src)) {
    return layers[0].src;
  }

  const width = 900;
  const height = 900;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Unable to create canvas context');
  }

  ctx.clearRect(0, 0, width, height);

  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  const centerX = width / 2;
  const centerY = height / 2;

  for (const layer of sortedLayers) {
    const image = new Image();

    // Important for local/public assets + uploads
    image.crossOrigin = 'anonymous';

    // Wait until image fully loads
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = layer.src;
    });

    // Extra safety for browser decoding
    if (image.decode) {
      try {
        await image.decode();
      } catch {
        // ignore decode errors
      }
    }

    const naturalW =
      layer.natural?.w ||
      image.naturalWidth ||
      image.width ||
      100;

    const naturalH =
      layer.natural?.h ||
      image.naturalHeight ||
      image.height ||
      100;

    const drawW = naturalW * layer.scaleX;
    const drawH = naturalH * layer.scaleY;

    ctx.save();

    ctx.translate(
      centerX + layer.pos.x,
      centerY + layer.pos.y
    );

    ctx.rotate((layer.rotate * Math.PI) / 180);

    ctx.drawImage(
      image,
      -drawW / 2,
      -drawH / 2,
      drawW,
      drawH
    );

    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}

  async function postToHome() {
    if (!postName.trim()) return;
    isPosting = true;
    try {
      const dataUrl = await createCompositeDataUrl();
      const existing = loadPosts();
      const post = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: postName.trim(),
        src: dataUrl,
        createdAt: Date.now(),
        createdByEmail: $currentUserEmail || '',
        createdByName: $profileName || 'Guest',
        comments: []
      };
      const updated = [post, ...existing];
      window.localStorage.setItem(POSTS_KEY, JSON.stringify(updated));
      postModalOpen = false;
      goto('/home');
    } catch (error) {
      console.error('Posting failed', error);
      alert('Posting failed. Please make sure all stickers and overlays are loaded correctly and try again.');
    } finally {
      isPosting = false;
    }
  }

  function onCanvasPointerDown(e) {
    if (!canvasEl) return;
    if (!e.target.closest('.layer-wrapper')) {
      selectedLayerId = null;
    }
  }

  function getTransformStyle(layer) {
    return `translate(calc(-50% + ${layer.pos.x}px), calc(-50% + ${layer.pos.y}px)) scale(${layer.scaleX}, ${layer.scaleY}) rotate(${layer.rotate}deg)`;
  }

  function clampLayer(layer) {
    if (!canvasEl || !layer || !layer.natural.w) return;
    const canvasRect = canvasEl.getBoundingClientRect();
    const halfW = canvasRect.width / 2;
    const halfH = canvasRect.height / 2;
    const imgW = layer.natural.w * layer.scaleX;
    const imgH = layer.natural.h * layer.scaleY;
    const minX = -halfW + imgW / 2;
    const maxX = halfW - imgW / 2;
    const minY = -halfH + imgH / 2;
    const maxY = halfH - imgH / 2;
    const nextX = Math.min(maxX, Math.max(minX, layer.pos.x));
    const nextY = Math.min(maxY, Math.max(minY, layer.pos.y));
    updateLayer(layer.id, { pos: { x: nextX, y: nextY } });
  }

  function onHandlePointerDown(e, handle) {
    if (!selectedLayer || !canvasEl) return;
    e.preventDefault();
    e.stopPropagation();
    activeHandle = handle;
    handleStart = { x: e.clientX, y: e.clientY };
    initialScaleX = selectedLayer.scaleX;
    initialScaleY = selectedLayer.scaleY;
    initialRotate = selectedLayer.rotate;
    initialPos = { ...selectedLayer.pos };
    if (handle === 'rotate') {
      rotating = true;
      const canvasRect = canvasEl.getBoundingClientRect();
      const center = {
        x: canvasRect.left + canvasRect.width / 2 + selectedLayer.pos.x,
        y: canvasRect.top + canvasRect.height / 2 + selectedLayer.pos.y
      };
      rotateStartAngle = Math.atan2(handleStart.y - center.y, handleStart.x - center.x);
    } else {
      resizing = true;
    }
    window.addEventListener('pointermove', onHandlePointerMove);
    window.addEventListener('pointerup', onHandlePointerUp);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function onHandlePointerMove(e) {
    if (!activeHandle || !canvasEl || !selectedLayer || !selectedLayer.natural.w) return;
    const canvasRect = canvasEl.getBoundingClientRect();
    const center = {
      x: canvasRect.left + canvasRect.width / 2 + selectedLayer.pos.x,
      y: canvasRect.top + canvasRect.height / 2 + selectedLayer.pos.y
    };
    const rad = selectedLayer.rotate * (Math.PI / 180);
    const cosR = Math.cos(rad);
    const sinR = Math.sin(rad);

    const screenToLocal = (x, y) => ({
      x: x * cosR + y * sinR,
      y: -x * sinR + y * cosR
    });
    const localToScreen = (x, y) => ({
      x: x * cosR - y * sinR,
      y: x * sinR + y * cosR
    });

    const startLocal = screenToLocal(handleStart.x - center.x, handleStart.y - center.y);
    const currentLocal = screenToLocal(e.clientX - center.x, e.clientY - center.y);
    const deltaLocal = { x: currentLocal.x - startLocal.x, y: currentLocal.y - startLocal.y };
    const handleDir = handleVectors[activeHandle];

    if (activeHandle === 'rotate') {
      const currentAngle = Math.atan2(e.clientY - center.y, e.clientX - center.x);
      const deltaAngle = currentAngle - rotateStartAngle;
      updateLayer(selectedLayer.id, { rotate: initialRotate + deltaAngle * (180 / Math.PI) });
    } else {
      const halfWidth = (selectedLayer.natural.w * initialScaleX) / 2;
      const halfHeight = (selectedLayer.natural.h * initialScaleY) / 2;
      let nextScaleX = initialScaleX;
      let nextScaleY = initialScaleY;
      const sensitivity = 0.84;

      if (handleDir.x !== 0) {
        const projectedX = handleDir.x * deltaLocal.x;
        if (halfWidth > 0) {
          nextScaleX = Math.max(0.1, initialScaleX * (1 + projectedX / halfWidth * sensitivity));
        }
      }
      if (handleDir.y !== 0) {
        const projectedY = handleDir.y * deltaLocal.y;
        if (halfHeight > 0) {
          nextScaleY = Math.max(0.1, initialScaleY * (1 + projectedY / halfHeight * sensitivity));
        }
      }

      const shiftLocal = {
        x: (initialScaleX - nextScaleX) * (-handleDir.x * selectedLayer.natural.w / 2),
        y: (initialScaleY - nextScaleY) * (-handleDir.y * selectedLayer.natural.h / 2)
      };
      const shiftScreen = localToScreen(shiftLocal.x, shiftLocal.y);
      updateLayer(selectedLayer.id, {
        scaleX: nextScaleX,
        scaleY: nextScaleY,
        pos: { x: initialPos.x + shiftScreen.x, y: initialPos.y + shiftScreen.y }
      });
      clampLayer({ ...selectedLayer, scaleX: nextScaleX, scaleY: nextScaleY, pos: { x: initialPos.x + shiftScreen.x, y: initialPos.y + shiftScreen.y } });
    }
  }

  function onHandlePointerUp() {
    activeHandle = null;
    resizing = false;
    rotating = false;
    pushHistory();
    unsaved = true;
    window.removeEventListener('pointermove', onHandlePointerMove);
    window.removeEventListener('pointerup', onHandlePointerUp);
  }

  function onLayerImageLoad(layerId, event) {
    const img = event.target;
    if (!img) return;
    updateLayer(layerId, {
      natural: {
        w: img.naturalWidth,
        h: img.naturalHeight
      }
    });
    const loadedLayer = layers.find((layer) => layer.id === layerId);
    clampLayer(loadedLayer);
  }

  function loadDraft() {
    try {
      const key = DRAFT_KEY_PREFIX + ($currentUserEmail || 'guest');
      const stored = window.localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        if (Array.isArray(data.layers)) {
          layers = data.layers.map((layer) => ({
            ...layer,
            pos: { ...layer.pos },
            natural: { ...layer.natural }
          }));
        } else if (data.imageSrc) {
          layers = [createLayer('user', data.imageSrc)];
        }
        selectedLayerId = null;
      }
    } catch (error) {
      // ignore
    }
  }

  onMount(() => {
    loadDraft();

    const keydown = (e) => {
      if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        undo();
      }
      if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        redo();
      }
      if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        selectedLayerId = null;
      }
      if (e.key === 'Backspace') {
        const tag = document.activeElement && document.activeElement.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && selectedLayerId) {
          e.preventDefault();
          deleteSelectedLayer();
        }
      }
    };

    window.addEventListener('keydown', keydown);
    onDestroy(() => window.removeEventListener('keydown', keydown));
  });
</script>

<style>
  :global(body), :global(html) {
    margin: 0;
    padding: 0;
    min-height: 100%;
    background: #000;
  }

  .container {
    width: 100%;
    height: 100vh;
    background: #000000;
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-image: linear-gradient(rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.9)), url('/background.jpg');
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
  }

  .top-bar {
    display: flex;
    align-items: center;
    padding: 20px;
    position: relative;
    flex-shrink: 0;
  }

  .back {
    display: flex;
    align-items: center;
    gap: 12px;
    color: white;
    font-weight: bold;
    font-size: 22px;
    cursor: pointer;
    user-select: none;
    background: transparent;
    border: none;
    padding: 0;
    font-family: inherit;
  }

  .arrow {
    font-size: 58px;
    line-height: 1;
  }

  .top-right-box {
    position: absolute;
    right: 10px;
    top: 10px;
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
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .main {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 40px;
    padding: 0 60px;
    flex: 1;
    overflow: hidden;
  }

  .left-panel {
    width: 20%;
    height: 95%;
    border: 7px solid #9f3b5a;
    background: #000000;
    display: flex;
    flex-direction: column;
    padding: 18px;
    box-sizing: border-box;
  }

  .panel-header {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
  }

  .panel-button {
    flex: 1;
    padding: 12px 10px;
    border: 2px solid #9f3b5a;
    background: transparent;
    color: white;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .panel-button.active {
    background: #9f3b5a;
  }

  .asset-list {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    overflow-y: auto;
    padding-right: 4px;
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }

  .asset-list::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }

  .asset-item {
    width: 100%;
    aspect-ratio: 1 / 1;
    border: 2px solid #9f3b5a;
    background: rgba(255, 255, 255, 0.04);
    padding: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .asset-item img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .center-panel {
    width: 65%;
    height: 95%;
    border: 7px solid #9f3b5a;
    background: #000000;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .center-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    width: 100%;
    height: 100%;
  }

  .upload-box {
    margin-top: 20px;
    width: 90px;
    height: 90px;
    border: 7px solid #9f3b5a;
    display: flex;
    color: white;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: transparent;
  }

  .upload-box span {
    font-size: 60px;
  }

  .bottom-right-box {
    position: absolute;
    right: 25px;
    bottom: 40px;
    width: 80px;
    height: 80px;
    border: 7px solid #9f3b5a;
    background: #000000;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    cursor: pointer;
  }

  .bottom-right-box:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }

  .modal {
    width: min(420px, calc(100% - 40px));
    background: #111;
    border: 7px solid #9f3b5a;
    padding: 24px;
    box-sizing: border-box;
    color: white;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .modal h2 {
    margin: 0;
    font-size: 22px;
  }

  .modal label {
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-weight: bold;
  }

  .modal input {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid #9f3b5a;
    background: #000;
    color: white;
    font-size: 16px;
    box-sizing: border-box;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .editor-canvas {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
  }

  .layer-wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    transform-origin: center center;
    touch-action: none;
    cursor: grab;
  }

  .layer-wrapper.selected {
    outline: 2px dashed #9f3b5a;
  }

  .layer-wrapper:active {
    cursor: grabbing;
  }

  .handle {
    touch-action: none;
  }

  .layer-wrapper img {
    display: block;
    max-width: 100%;
    max-height: 100%;
    pointer-events: none;
    user-select: none;
  }

  .control-button {
    background: rgba(0,0,0,0.6);
    color: white;
    border: 2px solid #9f3b5a;
    padding: 8px 10px;
    cursor: pointer;
    font-weight: bold;
  }

  .handle {
    position: absolute;
    width: 14px;
    height: 14px;
    background: #fff;
    border: 3px solid #9f3b5a;
    border-radius: 2px;
    box-sizing: border-box;
    z-index: 30;
    cursor: nwse-resize;
  }

  .handle.rotate {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    cursor: grab;
  }

  .handle.tl { left: -8px; top: -8px; cursor: nwse-resize; }
  .handle.tr { right: -8px; top: -8px; cursor: nesw-resize; }
  .handle.bl { left: -8px; bottom: -8px; cursor: nesw-resize; }
  .handle.br { right: -8px; bottom: -8px; cursor: nwse-resize; }
  .handle.top { left: 50%; top: -8px; transform: translateX(-50%); cursor: ns-resize; }
  .handle.bottom { left: 50%; bottom: -8px; transform: translateX(-50%); cursor: ns-resize; }
  .handle.left { left: -8px; top: 50%; transform: translateY(-50%); cursor: ew-resize; }
  .handle.right { right: -8px; top: 50%; transform: translateY(-50%); cursor: ew-resize; }
  .handle.rotate { left: 50%; top: -36px; transform: translateX(-50%); }
</style>

<div class="container">
  <div class="top-bar">
    <button type="button" class="back" on:click={goHome}>
      <div class="arrow">⬅</div>
      <div>BACK</div>
    </button>

    <div style="display:flex; align-items:center; gap:8px; margin-left:auto;">
      <button type="button" class="control-button" on:click={undo} aria-label="Undo">↺</button>
      <button type="button" class="control-button" on:click={redo} aria-label="Redo">↻</button>
      <button type="button" class="control-button" on:click={saveDraft} aria-label="Save">SAVE</button>
      <button type="button" class="top-right-box" on:click={goProfile} aria-label="Profile">
        <img src={$profilePicture} alt="Profile" />
      </button>
    </div>
  </div>

  <div class="main">
    <div class="left-panel">
      <div class="panel-header">
        <button type="button" class="panel-button" class:active={activePanel === 'stickers'} on:click={() => selectPanel('stickers')}>
          STICKERS
        </button>
        <button type="button" class="panel-button" class:active={activePanel === 'overlays'} on:click={() => selectPanel('overlays')}>
          OVERLAYS
        </button>
      </div>
      <div class="asset-list">
        {#each assetItems as item}
          <button type="button" class="asset-item" on:click={() => addAsset(item, activePanel === 'stickers' ? 'sticker' : 'overlay')}>
            <img src={item} alt="Asset" draggable="false" crossorigin="anonymous" />
          </button>
        {/each}
      </div>
    </div>

    <div class="center-panel">
      <div class="center-content">
        <input bind:this={fileInput} type="file" accept="image/*" on:change={handleFile} style="display:none" />

        {#if !layers.length}
          <div>ADD YOUR OWN IMAGE AND START EDITING!</div>
          <button type="button" class="upload-box" on:click={openFilePicker} aria-label="Upload image">
            <span>⬆</span>
          </button>
        {:else}
          <div class="editor-canvas" bind:this={canvasEl} role="application" on:pointerdown={onCanvasPointerDown} on:pointermove={onPointerMove} on:pointerup={onPointerUp} on:pointercancel={onPointerUp} on:contextmenu|preventDefault>
            {#each layers as layer (layer.id)}
              <div
                class="layer-wrapper"
                class:selected={selectedLayerId === layer.id}
                role="button"
                tabindex="0"
                style="transform: {getTransformStyle(layer)}; z-index: {layer.zIndex};"
                on:pointerdown={(e) => onPointerDown(e, layer)}
              >
                <img src={layer.src} alt="Layer" draggable="false" crossorigin="anonymous" on:load={(e) => onLayerImageLoad(layer.id, e)} />
                {#if selectedLayerId === layer.id}
                  <button type="button" class="handle tl" on:pointerdown={(e) => onHandlePointerDown(e, 'tl')} aria-label="Resize top-left"></button>
                  <button type="button" class="handle tr" on:pointerdown={(e) => onHandlePointerDown(e, 'tr')} aria-label="Resize top-right"></button>
                  <button type="button" class="handle bl" on:pointerdown={(e) => onHandlePointerDown(e, 'bl')} aria-label="Resize bottom-left"></button>
                  <button type="button" class="handle br" on:pointerdown={(e) => onHandlePointerDown(e, 'br')} aria-label="Resize bottom-right"></button>
                  <button type="button" class="handle top" on:pointerdown={(e) => onHandlePointerDown(e, 'top')} aria-label="Resize top"></button>
                  <button type="button" class="handle bottom" on:pointerdown={(e) => onHandlePointerDown(e, 'bottom')} aria-label="Resize bottom"></button>
                  <button type="button" class="handle left" on:pointerdown={(e) => onHandlePointerDown(e, 'left')} aria-label="Resize left"></button>
                  <button type="button" class="handle right" on:pointerdown={(e) => onHandlePointerDown(e, 'right')} aria-label="Resize right"></button>
                  <button type="button" class="handle rotate" on:pointerdown={(e) => onHandlePointerDown(e, 'rotate')} aria-label="Rotate"></button>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <button
    type="button"
    class="bottom-right-box"
    on:click={openPostModal}
    disabled={!layers.length || isPosting}
    title={!layers.length ? 'Upload an image before posting' : 'Post your design'}
  >
    POST
  </button>

  {#if postModalOpen}
    <div
      class="modal-backdrop"
      role="button"
      tabindex="0"
      on:click={closePostModal}
      on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') closePostModal(); }}
    >
      <div class="modal" role="dialog" aria-modal="true" tabindex="0" on:click|stopPropagation on:pointerdown|stopPropagation on:keydown|stopPropagation>
        <h2>Post your picture</h2>
        <label>
          Name your picture
          <input
            type="text"
            bind:value={postName}
            placeholder="Picture name"
          />
        </label>
        <div class="modal-actions">
          <button type="button" class="control-button" on:click={postToHome} disabled={!postName.trim() || isPosting}>
            {isPosting ? 'Posting...' : 'Post'}
          </button>
          <button type="button" class="control-button" on:click={closePostModal}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>