// ═══════════════════════════════════════════════════════
//  dashboard.js  —  Full interactive logic for dashboard
// ═══════════════════════════════════════════════════════

// ── DATA LAYER ───────────────────────────────────────────
var DB = {
  getCommunities: function() { try { return JSON.parse(localStorage.getItem('_tl_communities') || '[]'); } catch(e) { return []; } },
  saveCommunities: function(d) { localStorage.setItem('_tl_communities', JSON.stringify(d)); },
  getPosts:       function() { try { return JSON.parse(localStorage.getItem('_tl_posts') || '[]'); } catch(e) { return []; } },
  savePosts:      function(d) { localStorage.setItem('_tl_posts', JSON.stringify(d)); },
  getNotifs:      function() { try { return JSON.parse(localStorage.getItem('_tl_notifs') || '[]'); } catch(e) { return []; } },
  saveNotifs:     function(d) { localStorage.setItem('_tl_notifs', JSON.stringify(d)); },
  getJoined:      function() { try { return JSON.parse(localStorage.getItem('_tl_joined') || '[]'); } catch(e) { return []; } },
  saveJoined:     function(d) { localStorage.setItem('_tl_joined', JSON.stringify(d)); },
  getVotes:       function() { try { return JSON.parse(localStorage.getItem('_tl_votes') || '{}'); } catch(e) { return {}; } },
  saveVotes:      function(d) { localStorage.setItem('_tl_votes', JSON.stringify(d)); }
};

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function timeAgo(ts) {
  var s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)   return 'just now';
  if (s < 3600) return Math.floor(s/60)   + 'm ago';
  if (s < 86400)return Math.floor(s/3600) + 'h ago';
  return Math.floor(s/86400) + 'd ago';
}

var SEED_COMMUNITIES = [
  { id: 'c-webdev',    name: 'webdev',          desc: 'Web development discussions — HTML, CSS, JS, frameworks and more.', category: 'Technology', emoji: '💻', members: 124000, privacy: 'public', createdBy: 'system', createdAt: Date.now()-1e9 },
  { id: 'c-design',    name: 'design',           desc: 'UI/UX and visual design inspiration and critique.',                 category: 'Art',        emoji: '🎨', members: 87000,  privacy: 'public', createdBy: 'system', createdAt: Date.now()-9e8 },
  { id: 'c-startups',  name: 'startups',         desc: 'Entrepreneurship, startup stories and growth hacking.',            category: 'Technology', emoji: '🚀', members: 203000, privacy: 'public', createdBy: 'system', createdAt: Date.now()-8e8 },
  { id: 'c-learn',     name: 'learnprogramming', desc: 'A place to learn to code together. All levels welcome.',           category: 'Technology', emoji: '🧠', members: 445000, privacy: 'public', createdBy: 'system', createdAt: Date.now()-7e8 },
  { id: 'c-gaming',    name: 'gaming',           desc: 'Video games, reviews, news and gaming culture.',                   category: 'Gaming',     emoji: '🎮', members: 312000, privacy: 'public', createdBy: 'system', createdAt: Date.now()-6e8 },
  { id: 'c-science',   name: 'science',          desc: 'Scientific discoveries, research and discussions.',                category: 'Science',    emoji: '🔬', members: 178000, privacy: 'public', createdBy: 'system', createdAt: Date.now()-5e8 },
];

// Seed if first time
function ensureSeed() {
  var existing = DB.getCommunities();
  if (existing.length === 0) {
    DB.saveCommunities(SEED_COMMUNITIES);
  }
}

// ── SESSION ──────────────────────────────────────────────
var currentUser = null;

// ── INIT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  currentUser = requireAuth();
  if (!currentUser) return;

  ensureSeed();
  loadUserInfo();
  renderAll();

  // date
  var now = new Date();
  var el = document.getElementById('dash-date');
  if (el) el.textContent = now.toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
});

function loadUserInfo() {
  var name  = currentUser.firstName || currentUser.username || currentUser.email;
  var email = currentUser.email || '';
  var uname = currentUser.username ? '@' + currentUser.username : email;

  setText('greeting-name', name);
  setText('nav-username',  uname);
  setText('profile-avatar', name[0].toUpperCase());
  setText('profile-name',   name);
  setText('profile-email',  email);
  setText('big-avatar',     name[0].toUpperCase());
  setText('big-name',       name);
  setText('big-email',      email);
  setText('big-username',   uname);
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── RENDER ALL ───────────────────────────────────────────
function renderAll() {
  renderStats();
  renderDiscover();
  renderHomePosts();
  renderFeed();
  renderMyCommunities();
  renderMyPosts();
  renderExplore();
  renderNotifications();
  renderProfileActivity();
  updateBadges();
  populatePostCommunityDropdown();
}

// ── STATS ────────────────────────────────────────────────
function renderStats() {
  var posts   = DB.getPosts().filter(function(p) { return p.author === currentUser.email; });
  var joined  = DB.getJoined();
  var votes   = Object.values(DB.getVotes()).filter(function(v) { return v === 'up'; }).length;
  var karma   = posts.reduce(function(a, p) { return a + (p.upvotes || 0); }, 0);

  setText('stat-posts',       posts.length);
  setText('stat-communities', joined.length);
  setText('stat-upvotes',     votes);
  setText('stat-karma',       karma);
  setText('pb-posts',         posts.length);
  setText('pb-communities',   joined.length);
  setText('pb-karma',         karma);
}

// ── BADGES ───────────────────────────────────────────────
function updateBadges() {
  var joined   = DB.getJoined();
  var myPosts  = DB.getPosts().filter(function(p) { return p.author === currentUser.email; });
  var unread   = DB.getNotifs().filter(function(n) { return !n.read; }).length;

  setText('sb-communities', joined.length);
  setText('sb-posts',       myPosts.length);
  setText('sb-notif',       unread);

  var badge = document.getElementById('notif-badge');
  if (badge) {
    badge.textContent = unread;
    badge.classList.toggle('hidden', unread === 0);
  }
}

// ── TAB SWITCHING ────────────────────────────────────────
function showTab(tabId, linkEl) {
  document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
  var panel = document.getElementById(tabId);
  if (panel) panel.classList.add('active');

  document.querySelectorAll('.sidebar-item').forEach(function(i) { i.classList.remove('active'); });
  if (linkEl) linkEl.classList.add('active');

  if (tabId === 'tab-explore') renderExplore();
}

// ── MODALS ───────────────────────────────────────────────
function openModal(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  if (id === 'modal-write-post')      populatePostCommunityDropdown();
  if (id === 'modal-notifications')   renderNotifications();
}
function closeModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add('hidden');
  document.body.style.overflow = '';
}
function overlayClose(e, id) {
  if (e.target === e.currentTarget) closeModal(id);
}

// ── DISCOVER (home page) ─────────────────────────────────
function renderDiscover() {
  var joined = DB.getJoined();
  var all    = DB.getCommunities();
  var list   = document.getElementById('discover-list');
  if (!list) return;

  var notJoined = all.filter(function(c) { return joined.indexOf(c.id) === -1; }).slice(0, 5);
  if (notJoined.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎉</div><p>You have joined all available communities!</p></div>';
    return;
  }

  list.innerHTML = notJoined.map(function(c) {
    return communityItemHTML(c, false);
  }).join('');
}

function communityItemHTML(c, isJoined) {
  var membersLabel = c.members >= 1000 ? (c.members/1000).toFixed(0) + 'K' : c.members;
  return '<div class="community-item" id="ci-' + c.id + '">' +
    '<div class="community-avatar">' + (c.emoji || '🏘️') + '</div>' +
    '<div style="flex:1;min-width:0">' +
      '<div class="community-name">r/' + c.name + '</div>' +
      '<div class="community-meta">' + membersLabel + ' members · ' + c.category + '</div>' +
    '</div>' +
    (isJoined
      ? '<button class="community-join joined-btn" onclick="leaveCommunity(\'' + c.id + '\')">&#10003; Joined</button>'
      : '<button class="community-join" onclick="joinCommunity(\'' + c.id + '\')">+ Join</button>'
    ) +
  '</div>';
}

// ── JOIN / LEAVE ─────────────────────────────────────────
function joinCommunity(cid) {
  var joined = DB.getJoined();
  if (joined.indexOf(cid) === -1) joined.push(cid);
  DB.saveJoined(joined);

  // bump member count
  var communities = DB.getCommunities();
  communities = communities.map(function(c) {
    if (c.id === cid) c.members = (c.members || 0) + 1;
    return c;
  });
  DB.saveCommunities(communities);

  // add notification
  var c = communities.find(function(x) { return x.id === cid; });
  addNotif('You joined r/' + (c ? c.name : cid), 'join');

  showToast('Joined r/' + (c ? c.name : cid) + '!', 'success');
  renderAll();
}

function leaveCommunity(cid) {
  var joined = DB.getJoined().filter(function(id) { return id !== cid; });
  DB.saveJoined(joined);

  var communities = DB.getCommunities();
  communities = communities.map(function(c) {
    if (c.id === cid) c.members = Math.max(0, (c.members || 1) - 1);
    return c;
  });
  DB.saveCommunities(communities);

  var c = communities.find(function(x) { return x.id === cid; });
  showToast('Left r/' + (c ? c.name : cid), 'info');
  renderAll();
}

// ── MY COMMUNITIES ───────────────────────────────────────
function renderMyCommunities() {
  var joined = DB.getJoined();
  var all    = DB.getCommunities();
  var list   = document.getElementById('my-communities-list');
  if (!list) return;

  var myCommunities = all.filter(function(c) { return joined.indexOf(c.id) !== -1; });
  if (myCommunities.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏘️</div><p>You haven\'t joined any communities yet. <button class="text-coral" style="background:none;border:none;cursor:pointer;font-weight:600;color:var(--coral)" onclick="showTab(\'tab-explore\',null)">Explore communities →</button></p></div>';
    return;
  }

  list.innerHTML = '<div class="community-list">' +
    myCommunities.map(function(c) { return communityItemHTML(c, true); }).join('') +
  '</div>';
}

// ── EXPLORE ──────────────────────────────────────────────
function renderExplore() {
  var joined   = DB.getJoined();
  var all      = DB.getCommunities();
  var query    = (document.getElementById('explore-search') || {}).value || '';
  var list     = document.getElementById('explore-list');
  if (!list) return;

  var filtered = all.filter(function(c) {
    if (!query) return true;
    return c.name.toLowerCase().includes(query.toLowerCase()) ||
           c.desc.toLowerCase().includes(query.toLowerCase()) ||
           c.category.toLowerCase().includes(query.toLowerCase());
  });

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><p>No communities found for "' + query + '"</p></div>';
    return;
  }

  list.innerHTML = '<div class="community-list">' +
    filtered.map(function(c) {
      var isJoined = joined.indexOf(c.id) !== -1;
      return communityItemHTML(c, isJoined);
    }).join('') +
  '</div>';
}

// ── CREATE COMMUNITY ─────────────────────────────────────
function createCommunity() {
  var name     = (document.getElementById('comm-name').value || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  var desc     = (document.getElementById('comm-desc').value || '').trim();
  var category = document.getElementById('comm-category').value;
  var privacy  = document.querySelector('input[name="comm-privacy"]:checked').value;

  clearFEs('comm-name-err', 'comm-desc-err');
  var ok = true;
  if (!name)        { setFE('comm-name-err', 'Community name is required');            ok = false; }
  if (name.length < 3) { setFE('comm-name-err', 'Name must be at least 3 characters'); ok = false; }
  if (!desc)        { setFE('comm-desc-err', 'Please add a description');              ok = false; }
  if (!ok) return;

  var all = DB.getCommunities();
  if (all.find(function(c) { return c.name === name; })) {
    setFE('comm-name-err', 'A community with this name already exists');
    return;
  }

  var EMOJIS = { Technology:'💻', Science:'🔬', Gaming:'🎮', Music:'🎵', Art:'🎨', Sports:'⚽', News:'📰', Other:'🏷️' };
  var newComm = {
    id: 'c-' + uid(), name: name, desc: desc, category: category,
    emoji: EMOJIS[category] || '🏷️', members: 1, privacy: privacy,
    createdBy: currentUser.email, createdAt: Date.now()
  };

  all.push(newComm);
  DB.saveCommunities(all);

  // auto-join
  var joined = DB.getJoined();
  joined.push(newComm.id);
  DB.saveJoined(joined);

  addNotif('You created r/' + name + ' 🎉', 'create');
  showToast('r/' + name + ' created!', 'success');

  // reset form
  document.getElementById('comm-name').value = '';
  document.getElementById('comm-desc').value = '';
  closeModal('modal-create-community');
  renderAll();
}

// ── POPULATE POST DROPDOWN ───────────────────────────────
function populatePostCommunityDropdown() {
  var joined = DB.getJoined();
  var all    = DB.getCommunities();
  var sel    = document.getElementById('post-community');
  if (!sel) return;

  var myCommunities = all.filter(function(c) { return joined.indexOf(c.id) !== -1; });
  sel.innerHTML = '<option value="">-- Select a community --</option>' +
    myCommunities.map(function(c) {
      return '<option value="' + c.id + '">r/' + c.name + '</option>';
    }).join('');
}

// ── SUBMIT POST ──────────────────────────────────────────
function submitPost() {
  var cid     = document.getElementById('post-community').value;
  var title   = (document.getElementById('post-title').value || '').trim();
  var content = (document.getElementById('post-content').value || '').trim();
  var type    = document.querySelector('input[name="post-type"]:checked').value;

  clearFEs('post-community-err', 'post-title-err', 'post-content-err');
  var ok = true;
  if (!cid)     { setFE('post-community-err', 'Please select a community'); ok = false; }
  if (!title)   { setFE('post-title-err',     'Title is required');          ok = false; }
  if (!content) { setFE('post-content-err',   'Content cannot be empty');    ok = false; }
  if (!ok) return;

  setBusy('submit-post-btn', true);

  setTimeout(function() {
    var all  = DB.getCommunities();
    var comm = all.find(function(c) { return c.id === cid; });
    var post = {
      id: 'p-' + uid(), communityId: cid,
      communityName: comm ? comm.name : cid,
      title: title, content: content, type: type,
      author: currentUser.email,
      authorName: currentUser.firstName || currentUser.username || currentUser.email,
      upvotes: 0, downvotes: 0, comments: [],
      createdAt: Date.now()
    };

    var posts = DB.getPosts();
    posts.unshift(post);
    DB.savePosts(posts);

    addNotif('Your post "' + title.slice(0, 40) + '" was published!', 'post');
    showToast('Post published!', 'success');

    document.getElementById('post-community').value = '';
    document.getElementById('post-title').value     = '';
    document.getElementById('post-content').value   = '';
    closeModal('modal-write-post');
    setBusy('submit-post-btn', false);
    renderAll();
  }, 500);
}

// ── RENDER POSTS (home + feed + my posts) ────────────────
function postCardHTML(post, showDelete) {
  var votes   = DB.getVotes();
  var myVote  = votes[post.id] || null;
  var upClass = myVote === 'up'   ? 'vote-active-up'   : '';
  var dnClass = myVote === 'down' ? 'vote-active-down' : '';

  return '<div class="post-card" id="pc-' + post.id + '">' +
    '<div class="post-card-top">' +
      '<span class="post-badge">r/' + post.communityName + '</span>' +
      '<span class="post-time">' + timeAgo(post.createdAt) + '</span>' +
    '</div>' +
    '<h4 class="post-title-txt" onclick="openPostDetail(\'' + post.id + '\')" style="cursor:pointer">' + escHtml(post.title) + '</h4>' +
    '<p class="post-excerpt">' + escHtml(post.content.slice(0, 160)) + (post.content.length > 160 ? '…' : '') + '</p>' +
    '<div class="post-card-footer">' +
      '<div class="vote-row">' +
        '<button class="vote-btn ' + upClass + '" onclick="vote(\'' + post.id + '\',\'up\')">&#9650; ' + (post.upvotes || 0) + '</button>' +
        '<button class="vote-btn down ' + dnClass + '" onclick="vote(\'' + post.id + '\',\'down\')">&#9660; ' + (post.downvotes || 0) + '</button>' +
      '</div>' +
      '<button class="comment-btn" onclick="openPostDetail(\'' + post.id + '\')">&#x1F4AC; ' + (post.comments ? post.comments.length : 0) + ' comments</button>' +
      (showDelete ? '<button class="delete-btn" onclick="deletePost(\'' + post.id + '\')">&#x1F5D1; Delete</button>' : '') +
    '</div>' +
  '</div>';
}

function renderHomePosts() {
  var all  = DB.getPosts().slice(0, 5);
  var list = document.getElementById('home-posts-list');
  if (!list) return;
  if (all.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📝</div><p>No posts yet. <button style="background:none;border:none;cursor:pointer;font-weight:600;color:var(--coral)" onclick="openModal(\'modal-write-post\')">Be the first to post!</button></p></div>';
    return;
  }
  list.innerHTML = all.map(function(p) { return postCardHTML(p, false); }).join('');
}

function renderFeed() {
  var joined = DB.getJoined();
  var all    = DB.getPosts().filter(function(p) { return joined.indexOf(p.communityId) !== -1; });
  var list   = document.getElementById('feed-list');
  if (!list) return;
  if (all.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>Join communities to see posts here.</p></div>';
    return;
  }
  list.innerHTML = all.map(function(p) { return postCardHTML(p, false); }).join('');
}

function renderMyPosts() {
  var myPosts = DB.getPosts().filter(function(p) { return p.author === currentUser.email; });
  var list    = document.getElementById('my-posts-list');
  if (!list) return;
  if (myPosts.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✍️</div><p>You haven\'t posted yet. <button style="background:none;border:none;cursor:pointer;font-weight:600;color:var(--coral)" onclick="openModal(\'modal-write-post\')">Write your first post!</button></p></div>';
    return;
  }
  list.innerHTML = myPosts.map(function(p) { return postCardHTML(p, true); }).join('');
}

// ── DELETE POST ──────────────────────────────────────────
function deletePost(pid) {
  if (!confirm('Delete this post?')) return;
  var posts = DB.getPosts().filter(function(p) { return p.id !== pid; });
  DB.savePosts(posts);
  showToast('Post deleted', 'info');
  renderAll();
}

// ── VOTING ───────────────────────────────────────────────
function vote(pid, dir) {
  var posts  = DB.getPosts();
  var votes  = DB.getVotes();
  var prev   = votes[pid] || null;
  var post   = posts.find(function(p) { return p.id === pid; });
  if (!post) return;

  // undo if same
  if (prev === dir) {
    if (dir === 'up')   post.upvotes   = Math.max(0, (post.upvotes   || 0) - 1);
    if (dir === 'down') post.downvotes = Math.max(0, (post.downvotes || 0) - 1);
    delete votes[pid];
  } else {
    // remove previous
    if (prev === 'up')   post.upvotes   = Math.max(0, (post.upvotes   || 0) - 1);
    if (prev === 'down') post.downvotes = Math.max(0, (post.downvotes || 0) - 1);
    // add new
    if (dir === 'up')   post.upvotes   = (post.upvotes   || 0) + 1;
    if (dir === 'down') post.downvotes = (post.downvotes || 0) + 1;
    votes[pid] = dir;
  }

  DB.savePosts(posts);
  DB.saveVotes(votes);
  renderAll();
}

// ── POST DETAIL ──────────────────────────────────────────
var currentDetailPost = null;

function openPostDetail(pid) {
  var post = DB.getPosts().find(function(p) { return p.id === pid; });
  if (!post) return;
  currentDetailPost = pid;

  setText('detail-title', post.title);

  var meta = document.getElementById('detail-meta');
  if (meta) meta.innerHTML =
    '<span class="post-badge">r/' + post.communityName + '</span>' +
    ' &nbsp; by <strong>' + escHtml(post.authorName) + '</strong>' +
    ' &nbsp; ' + timeAgo(post.createdAt);

  var body = document.getElementById('detail-body');
  if (body) body.textContent = post.content;

  var votes = document.getElementById('detail-votes');
  if (votes) votes.innerHTML =
    '<button class="vote-btn" onclick="vote(\'' + post.id + '\',\'up\');refreshDetail(\'' + post.id + '\')">&#9650; ' + (post.upvotes||0) + ' upvotes</button>&nbsp;' +
    '<button class="vote-btn down" onclick="vote(\'' + post.id + '\',\'down\');refreshDetail(\'' + post.id + '\')">&#9660; ' + (post.downvotes||0) + ' downvotes</button>';

  renderComments(post);
  document.getElementById('comment-input').value = '';
  openModal('modal-post-detail');
}

function refreshDetail(pid) {
  var post = DB.getPosts().find(function(p) { return p.id === pid; });
  if (!post) return;
  var votes = document.getElementById('detail-votes');
  if (votes) votes.innerHTML =
    '<button class="vote-btn" onclick="vote(\'' + post.id + '\',\'up\');refreshDetail(\'' + post.id + '\')">&#9650; ' + (post.upvotes||0) + ' upvotes</button>&nbsp;' +
    '<button class="vote-btn down" onclick="vote(\'' + post.id + '\',\'down\');refreshDetail(\'' + post.id + '\')">&#9660; ' + (post.downvotes||0) + ' downvotes</button>';
}

function renderComments(post) {
  var list = document.getElementById('comments-list');
  setText('comment-count', '(' + (post.comments ? post.comments.length : 0) + ')');
  if (!list) return;
  if (!post.comments || post.comments.length === 0) {
    list.innerHTML = '<p style="color:var(--grey-3);font-size:0.875rem">No comments yet. Be the first!</p>';
    return;
  }
  list.innerHTML = post.comments.map(function(c) {
    return '<div class="comment-item">' +
      '<div class="comment-author">' + escHtml(c.authorName) + ' <span class="comment-time">' + timeAgo(c.createdAt) + '</span></div>' +
      '<div class="comment-body">' + escHtml(c.text) + '</div>' +
    '</div>';
  }).join('');
}

function submitComment() {
  var text = (document.getElementById('comment-input').value || '').trim();
  if (!text) { showToast('Comment cannot be empty', 'error'); return; }
  if (!currentDetailPost) return;

  var posts = DB.getPosts();
  var post  = posts.find(function(p) { return p.id === currentDetailPost; });
  if (!post) return;

  if (!post.comments) post.comments = [];
  post.comments.push({
    id: uid(), text: text,
    author: currentUser.email,
    authorName: currentUser.firstName || currentUser.username || currentUser.email,
    createdAt: Date.now()
  });

  DB.savePosts(posts);
  document.getElementById('comment-input').value = '';
  addNotif('You commented on "' + post.title.slice(0,40) + '"', 'comment');
  showToast('Comment posted!', 'success');
  renderComments(post);
  renderAll();
}

// ── NOTIFICATIONS ────────────────────────────────────────
function addNotif(msg, type) {
  var notifs = DB.getNotifs();
  notifs.unshift({ id: uid(), msg: msg, type: type || 'info', read: false, createdAt: Date.now() });
  if (notifs.length > 50) notifs = notifs.slice(0, 50);
  DB.saveNotifs(notifs);
  updateBadges();
}

function renderNotifications() {
  var notifs = DB.getNotifs();
  var list   = document.getElementById('notif-list');
  if (!list) return;

  if (notifs.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔔</div><p>No notifications yet.</p></div>';
    return;
  }

  var icons = { join:'🏘️', create:'✨', post:'📝', comment:'💬', info:'ℹ️' };
  list.innerHTML = notifs.map(function(n) {
    return '<div class="notif-item' + (n.read ? '' : ' notif-unread') + '" onclick="markRead(\'' + n.id + '\')">' +
      '<span class="notif-icon">' + (icons[n.type] || 'ℹ️') + '</span>' +
      '<div class="notif-body">' +
        '<span class="notif-msg">' + escHtml(n.msg) + '</span>' +
        '<span class="notif-time">' + timeAgo(n.createdAt) + '</span>' +
      '</div>' +
      (!n.read ? '<span class="notif-dot"></span>' : '') +
    '</div>';
  }).join('');
}

function markRead(id) {
  var notifs = DB.getNotifs().map(function(n) {
    if (n.id === id) n.read = true;
    return n;
  });
  DB.saveNotifs(notifs);
  renderNotifications();
  updateBadges();
}

function markAllRead() {
  var notifs = DB.getNotifs().map(function(n) { n.read = true; return n; });
  DB.saveNotifs(notifs);
  renderNotifications();
  updateBadges();
  showToast('All notifications marked as read', 'success');
}

// ── PROFILE ACTIVITY ─────────────────────────────────────
function renderProfileActivity() {
  var myPosts = DB.getPosts().filter(function(p) { return p.author === currentUser.email; }).slice(0, 5);
  var list    = document.getElementById('profile-activity');
  if (!list) return;

  if (myPosts.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><p>No activity yet.</p></div>';
    return;
  }

  list.innerHTML = myPosts.map(function(p) {
    return '<div class="activity-item">' +
      '<span class="activity-icon">📝</span>' +
      '<div class="activity-body">' +
        '<span class="activity-title">' + escHtml(p.title) + '</span>' +
        '<span class="activity-meta">r/' + p.communityName + ' · ' + timeAgo(p.createdAt) + '</span>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ── LOGOUT ───────────────────────────────────────────────
function doLogout() {
  Store.clearSession();
  showToast('Signed out', 'info');
  setTimeout(function() { window.location.href = 'login.html'; }, 600);
}

// ── HELPERS ──────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
