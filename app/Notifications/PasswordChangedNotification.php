<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordChangedNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct()
    {
        
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail']; // Hanya kirim via email
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
                    ->subject('Password Anda Telah Diubah')
                    ->greeting('Halo, ' . $notifiable->first_name)
                    ->line('Password akun Anda baru saja diubah.')
                    ->line('Jika ini bukan Anda, segera hubungi kami atau reset password Anda kembali.')
                    ->salutation('Salam, Tim Lobaca');
    }

    /**
     * Get the array representation of the notification (jika pakai database).
     */
    public function toArray(object $notifiable): array
    {
        return [
            'message' => 'Password diubah pada ' . now(),
        ];
    }
}