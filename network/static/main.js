import { fetchHeaders, getCookie } from './utils.js';
import { generateEditButton, generateLikeButton, generatePost, generateProfile } from './generators.js';

let pageNumber = 1;
const postsPerPage = 10;
let currentView = 'index';


const csrftoken = getCookie('csrftoken');

document.addEventListener('DOMContentLoaded', () => {

  document.querySelector('#index-nav-link').addEventListener('click', () => loadView('index'));
  document.querySelector('#btn-next-page').addEventListener('click', onClickNextPageButton);
  document.querySelector('#btn-previous-page').addEventListener('click', onClickPreviousPageButton);

  const followingLink = document.querySelector('#following-nav-link');

  if (followingLink) {
    document.querySelector('#following-nav-link').addEventListener('click', () => loadView('feed'));
  }
  
  const postForm = document.querySelector('#post-form')
  if (postForm) {
    postForm.addEventListener('submit', submit_post);
  }
  loadView('index');
})

function loadPosts(currentView, pageNumber, postsPerPage) {

  // remove old posts from the DOM
  document.querySelector('#post-display-div').innerHTML = "";

  // compose url for GET request
  let url = `/posts?page=${pageNumber}&perPage=${postsPerPage}`;

  if (currentView === 'profile') {
    url = url.concat(`&user=${document.querySelector('#profile-div-title').innerHTML}`);
  }

  if (currentView === 'feed') {
    url = url.concat(`&feed=true`)
  }

  // make GET request to '/posts' route & consume API
  fetch(url)
  .then(response => response.json())
  .then(data => {
    data.posts.forEach(post => addPostToDOM({
      'post' : post,
      'user' : data['requested_by'],
      'position' : 'end'
    }));
    updatePagination(data);
  })
}

function loadView(view) {
  currentView = view;
  pageNumber = 1;

  // only show profile on the profile view
  const profileDiv = document.querySelector('#profile-div-container');
  profileDiv.style.display = (view === 'profile') ? 'block' : 'none';

  // only show post form 
  const postFormDiv = document.querySelector('#post-form-div');
  postFormDiv.style.display = (view === 'index') ? 'block' : 'none';

  loadPosts(currentView, pageNumber, postsPerPage);
}

function addPostToDOM(context) {
  const post = generatePost(context);

  // add listener to title (loads profile on click)
  const title = post.querySelector(".post-title");
  title.addEventListener('click', () => onClickPostTitle(context.post));

  // add a like btn if the user is signed in
  if (context.user) {
    const likers = context.post.liked_by;

    // set like btn state according to whether user likes post
    let likeButtonState = 'like';
    likers.forEach(liker => {
      if (liker === context.user) likeButtonState = 'unlike';
    })
    const likeButton = generateLikeButton(likeButtonState, likers.length);   
    post.querySelector('.post-body').appendChild(likeButton);

    likeButton.firstChild.addEventListener('click', () => {
      onClickLikeButton(post);
    })
  }

  // if post is authored by the user, generate an edit button
  if (title.innerHTML === context.user) {
    const editor = generateEditButton();
    editor.addEventListener('click', () => {
      onClickEditButton(post);
    })
    post.querySelector('.post-body').appendChild(editor);
  }

  // append/prepend post to DOM
  if (context.position === 'end') {
    document.querySelector('#post-display-div').append(post);
  } else {
    // trigger fade-in animation
    post.style.animationName = 'fade-in';
    post.style.animationDuration = '1s';
    document.querySelector('#post-display-div').prepend(post);
  }
}

function add_profile_to_DOM(contents) {
  const profile = generateProfile(contents);
  
  // add listener to follow button (follows/unfollows on click)
  const followButton = profile.querySelector("#follow-button")
  if (followButton) {
    followButton.addEventListener('click', () => onClickFollowButton(contents))
  }
  
  // replace old profile HTML with new
  document.querySelector("#profile-div-container").innerHTML = "";
  document.querySelector("#profile-div-container").appendChild(profile);
}

function submit_post(event) {
  event.preventDefault();
  
  // create POST request using form data
  fetch('/submit_post', {
    method: 'POST',
    credentials: 'same-origin',
    headers: fetchHeaders(csrftoken),
    body: JSON.stringify({
      'message': document.querySelector('#post-form-msg').value
    })
  })
  .then(response => response.json())
  .then(post => {
    addPostToDOM({'post' : post, 'user' : post.author, 'position' : 'front'})
    document.querySelector('#post-form-msg').value = "";
  })
}

function onClickPostTitle(post) {
  // make a GET request to the user profile API route
  fetch(`user/${post.author}`)
  .then(response => response.json())
  .then(data => {
    add_profile_to_DOM(data);
    loadView('profile');
  })
}

function onClickEditButton(target) {
  const post = target.querySelector('.card-text');
  const postID = target.id;
  const textArea = target.querySelector('.card-text-editor');
  const button = target.querySelector('.edit-btn');

  if (button.innerHTML === "Edit") {
    button.innerHTML = "Save";
    post.style.display = "none";
    textArea.style.display = "block";
    textArea.value = post.innerHTML;
  } else {
    fetch(`post/${postID}`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: fetchHeaders(csrftoken),
      body: JSON.stringify({
        'message': textArea.value
      })
    })
    .then(() => {
      button.innerHTML = "Edit";
      post.innerHTML = textArea.value;
      textArea.value = "";
      post.style.display = "block";
      textArea.style.display = "none";
    })

  }
}
  

function onClickFollowButton(contents) {
  // make a GET request to the follow API route
  fetch(`user/${contents['username']}/follow`)

  // use JSON response to re-generate profile from new data in DB
  // TODO: perhaps only updating follow btn state & follower/ing counters would be more efficient
  .then(response => response.json())
  .then(data => {
    add_profile_to_DOM(data);
  })
}

function onClickLikeButton(post) {

  const likeBtnState = post.querySelector('.like-btn') ? 'like' : 'unlike';

  fetch(`post/${post.id}/like`, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: fetchHeaders(csrftoken),
    body: JSON.stringify({
      'state' : likeBtnState
    })
  })
  .then(response => response.json())
  .then(data => {
    post.querySelector(`.${likeBtnState}-btn`).className = `${data['state']}-btn`;
    post.querySelector('.counter-txt').innerHTML = data['likes'];
  })
}

function onClickNextPageButton(contents) {
  pageNumber++;
  loadPosts(currentView, pageNumber, postsPerPage);
}

function onClickPreviousPageButton(contents) {
  pageNumber--;
  loadPosts(currentView, pageNumber, postsPerPage);
}

function updatePagination(data) {
  document.querySelector('#btn-next-page').style.display = 
    data["has_next_page"] ? "block" : "none";

  document.querySelector('#btn-previous-page').style.display =
    data["has_previous_page"] ? "block" : "none";

  document.querySelector('#page-number').innerHTML = `
    Page ${data["page"]} of ${data["page_count"]}
  `;
}