from django.urls import path
from django.contrib import admin
from nsysu_hub import views
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path('', views.home_view, name='home'),
    path('posts/', views.all_posts_view, name='posts'),
    path('myposts/', views.myposts_view, name='myposts'),
    path('settings/', views.settings_view, name='settings'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('like/<int:post_id>/', views.like_post, name='like_post'),
    path('comments/<int:post_id>/', views.comments, name='comments'),
    path('change_password/', views.change_password, name='change_password'),
    path('change_email/', views.change_email, name='change_email'),
    path('admin/', admin.site.urls, name='admin'),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])