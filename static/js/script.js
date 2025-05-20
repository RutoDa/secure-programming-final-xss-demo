window.CSRF_TOKEN = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

function toggleLike(postId) {
    fetch('/like/' + postId, {
        method: 'GET',
    })
        .then((response) => response.json())
        .then((data) => {
            // Update like count and button appearance
            const likeBtn = document.querySelector(`.like-btn[data-post-id="${postId}"]`)
            const likeCount = data.likes

            // Update the like count
            likeBtn.innerHTML = `<i class="fas fa-heart"></i> ${likeCount}`

            // Toggle button class based on liked status
            if (data.liked) {
                likeBtn.classList.remove('btn-outline-danger')
                likeBtn.classList.add('btn-danger')
            } else {
                likeBtn.classList.remove('btn-danger')
                likeBtn.classList.add('btn-outline-danger')
            }
        })
        .catch((error) => console.error('Error:', error))
}

function loginPrompt() {
    Swal.fire({
        title: 'Login Required',
        text: 'Please log in to like posts or leave comments',
        icon: 'info',
        confirmButtonText: 'Log in',
        confirmButtonColor: '#3085d6',
        showCancelButton: true,
        cancelButtonText: 'Later'
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = '/login/';
        }
    });
}

function showComments(postId) {
    // Show loading state
    Swal.fire({
        title: 'Loading comments...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // Fetch comments from server
    fetch(`/comments/${postId}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load comments');
            }
            return response.json();
        })
        .then(data => {
            // Update the comment count
            const commentBtn = document.querySelector(`.comment-btn[data-post-id="${postId}"]`)
            commentBtn.innerHTML = `<i class="fas fa-comment"></i> ${data.comment_count}`

            // Create comment HTML
            let commentsHtml = '';

            if (data.comments.length === 0) {
                commentsHtml = '<p class="text-center">No comments yet. Be the first to comment!</p>';
            } else {
                commentsHtml = data.comments.map(comment => `
                    <div class="comment mb-3 p-3 border rounded bg-light">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-user-circle mr-2"></i>&nbsp;
                                <strong class="text-primary">${comment.username}</strong>
                            </div>
                            <small class="text-muted">${comment.created_at}</small>
                        </div>
                        <p class="mb-0 text-dark text-start">${comment.content}</p>
                    </div>
                `).join('');
            }


            const commentForm = `
                <form id="comment-form-${postId}" class="mt-3">
                    <div class="form-group">
                        <textarea class="form-control" id="comment-text-${postId}" rows="2" placeholder="Write a comment..."></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary w-100 mt-3" id="submit-comment-${postId}">Post Comment</button>
                </form>
            `;


            Swal.fire({
                title: data.post_title || 'Comments',
                html: `
                    <div class="comments-container">
                        ${commentsHtml}
                    </div>
                    ${commentForm}
                `,
                width: '600px',
                showCloseButton: true,
                showConfirmButton: false,
                didOpen: () => {
                    document.getElementById('comment-form-' + postId).addEventListener('submit', function (e) {
                        e.preventDefault();
                        submitComment(postId, document.getElementById('comment-text-' + postId).value);
                    });
                }
            });
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error',
                text: 'Could not load comments. Please try again later.',
                icon: 'error'
            });
        });
}

// Helper function to submit a new comment
function submitComment(postId, commentText) {
    if (!commentText.trim()) return;

    fetch(`/comments/${postId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': window.CSRF_TOKEN,
        },
        body: JSON.stringify({ content: commentText })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Refresh comments
                showComments(postId);
            } else {
                throw new Error(data.message || 'Failed to post comment');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error',
                text: 'Could not post your comment. Please try again.',
                icon: 'error'
            });
        });
}


function checkPassword() {
    const old_password = document.getElementById("old_password").value;
    const password = document.getElementById("new_password1").value;
    const confirmPassword = document.getElementById("new_password2").value;

    if (old_password === "" || password === "" || confirmPassword === "") {
        Swal.fire({
            title: "Error",
            text: "Please fill in all fields.",
            icon: "error",
        });
        return false;
    }
    if (password !== confirmPassword) {
        Swal.fire({
            title: "Error",
            text: "Passwords do not match.",
            icon: "error",
        });
        return false;
    }
    changePassword(old_password, password);
    return true;
}

function changePassword(old_password, password) {
    const url = "/change_password/";
    const data = {
        old_password: old_password,
        new_password: password,
    };

    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'X-CSRFToken': window.CSRF_TOKEN,
        },
        body: JSON.stringify(data),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.status === "success") {
                Swal.fire({
                    title: "Success",
                    text: "Password changed successfully.",
                    icon: "success",
                }).then((result) => {
                    window.location.href = '/login/';
                });
            } else {
                Swal.fire({
                    title: "Error",
                    text: data.message,
                    icon: "error",
                });
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            Swal.fire({
                title: "Error",
                text: "An error occurred. Please try again.",
                icon: "error",
            });
        });
}

if (document.getElementById("change_password_form")) {
    document.getElementById("change_password_form").addEventListener("submit", function (e) {
        e.preventDefault();
        checkPassword();
    });
}


function checkEmail() {
    const email = document.getElementById("new_email").value;
    const confirmEmail = document.getElementById("new_email2").value;

    if (email === "" || confirmEmail === "") {
        Swal.fire({
            title: "Error",
            text: "Please fill in all fields.",
            icon: "error",
        });
        return false;
    }
    if (email !== confirmEmail) {
        Swal.fire({
            title: "Error",
            text: "Emails do not match.",
            icon: "error",
        });
        return false;
    }
    return true;
}

function changeEmail(email) {
    const url = "/change_email/";
    const data = {
        new_email: email,
    };

    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'X-CSRFToken': window.CSRF_TOKEN,
        },
        body: JSON.stringify(data),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.status === "success") {
                Swal.fire({
                    title: "Success",
                    text: "Email changed successfully.",
                    icon: "success",
                }).then((result) => {
                    if (document.getElementById("current-mail")) {
                        document.getElementById("current-mail").innerHTML = email;
                    }
                });
            } else {
                Swal.fire({
                    title: "Error",
                    text: data.message,
                    icon: "error",
                });
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            Swal.fire({
                title: "Error",
                text: "An error occurred. Please try again.",
                icon: "error",
            });
        });
}

if (document.getElementById("change_email_form")) {
    document.getElementById("change_email_form").addEventListener("submit", function (e) {
        e.preventDefault();
        if (checkEmail()) {
            const email = document.getElementById("new_email").value;
            changeEmail(email);
        }
    });
}


function welcomeUser() {
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name');
    if (!name) return;
    Swal.fire({
        title: 'Welcome back !',
        html: `Welcome back ${name}! <br>Feel free to explore and interact with the posts.`,
        icon: 'success',
        confirmButtonText: 'Continue',
        confirmButtonColor: '#3085d6'
    });
}

document.addEventListener('DOMContentLoaded', function () {
    welcomeUser();
});

