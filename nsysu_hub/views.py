from django.shortcuts import render, redirect
from django.http import JsonResponse
from .models import Post, Comment, UserLike
from django.contrib.auth.decorators import login_required
from django.db.models import F
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib import messages
import json


def home_view(request):
    if request.method == 'GET':
        search = request.GET.get('search', '').strip()
        search_results = Post.objects.filter(content__icontains=search).order_by('-created_at')
        if not search_results.exists():
            messages.add_message(request, messages.INFO, 'No posts found.')
    
    hot_posts = Post.objects.all().order_by('-likes')[:15]
    liked_posts = []
    if request.user.is_authenticated:
        liked_posts = UserLike.objects.filter(user=request.user).values_list('post', flat=True)
        liked_posts = Post.objects.filter(id__in=liked_posts).order_by('-likes')[:5]
    
    return render(request, 'home.html', locals())

@login_required(login_url='/login/')
def myposts_view(request):
    if request.method == 'POST':
        content = request.POST.get('content', '').strip()
        if content:
            Post.objects.create(user=request.user, content=content)
            messages.add_message(request, messages.INFO, 'Post created successfully.')
        else:
            messages.add_message(request, messages.ERROR, 'Content cannot be empty.')
    
    my_posts = Post.objects.filter(user=request.user).order_by('-created_at')
    liked_posts = UserLike.objects.filter(user=request.user).values_list('post', flat=True)
    liked_posts = Post.objects.filter(id__in=liked_posts).order_by('-created_at')
    return render(request, 'myposts.html', locals())

@login_required(login_url='/login/')
def all_posts_view(request):
    all_posts = Post.objects.all().order_by('-created_at')
    liked_posts = UserLike.objects.filter(user=request.user).values_list('post', flat=True)
    liked_posts = Post.objects.filter(id__in=liked_posts).order_by('-created_at')
    return render(request, 'posts.html', locals())

def login_view(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            auth_login(request, user)
            messages.add_message(request, messages.INFO, 'Logged in successfully.')
            return redirect(f'/?name={username}')
        else:
            return render(request, 'login.html', {'error': 'Invalid credentials'})
    return render(request, 'login.html')


@login_required(login_url='/login/')
def logout_view(request):
    auth_logout(request)
    messages.add_message(request, messages.INFO, 'Logged out successfully.')
    return redirect('home')


@login_required(login_url='/login/')
def like_post(request, post_id):
    if UserLike.objects.filter(user=request.user, post_id=post_id).exists():
        Post.objects.filter(id=post_id).update(likes=F('likes') - 1)
        UserLike.objects.filter(user=request.user, post_id=post_id).delete()
    else:
        Post.objects.filter(id=post_id).update(likes=F('likes') + 1)
        UserLike.objects.create(user=request.user, post_id=post_id)
        
    likes = Post.objects.get(id=post_id).likes
    liked = UserLike.objects.filter(user=request.user, post_id=post_id).exists()
    return JsonResponse({'likes': likes, 'liked': liked})


@login_required(login_url='/login/')
def comments(request, post_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            content = data.get('content', '').strip()
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid format'}, status=400)

        if not content:
            return JsonResponse({'status': 'error', 'message': 'Content cannot be empty'}, status=400)
        Comment.objects.create(user=request.user, post_id=post_id, content=content)
        Post.objects.filter(id=post_id).update(comment_count=F('comment_count') + 1)
        return JsonResponse({'success': True})
    
    comments = Comment.objects.filter(post_id=post_id).order_by('-created_at')
    return JsonResponse({
        'post_id': post_id,
        'comments': [
            {
                'username': comment.user.username,
                'content': comment.content,
                'created_at': comment.created_at.strftime('%Y-%m-%d %H:%M:%S')
            } for comment in comments
        ],
        'comment_count': len(comments)
    })


@login_required(login_url='/login/')
def settings_view(request):
    return render(request, 'settings.html', locals())


@login_required(login_url='/login/')
def change_password(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            old_password = data.get('old_password', '').strip()
            new_password = data.get('new_password', '').strip()
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid format'}, status=400)
        
        if not old_password or not new_password:
            return JsonResponse({'status': 'error', 'message': 'Old password and new password cannot be empty.'})
        
        if not request.user.check_password(old_password):
            return JsonResponse({'status': 'error', 'message': 'Old password is incorrect.'})
        
        
        request.user.set_password(new_password)
        request.user.save()
        
    return JsonResponse({'status': 'success'})


@login_required(login_url='/login/')
def change_email(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            new_email = data.get('new_email', '').strip()
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid format'}, status=400)
        
        if not new_email:
            return JsonResponse({'status': 'error', 'message': 'New email cannot be empty.'})
        
        request.user.email = new_email
        request.user.save()
        
    return JsonResponse({'status': 'success'})