<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    use Queueable;
    public string $token;

    public function __construct(string $token)
    {
        $this->token = $token; 
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Kode Verifikasi Reset Password')
            ->greeting('Halo, ' . $notifiable->first_name)
            ->line('Kode verifikasi Anda adalah: **' . $this->token . '**')
            ->line('Kode ini berlaku selama 5 menit.')
            ->line('Jika Anda tidak meminta ini, abaikan email ini.')
            ->salutation('Salam, Tim Lobaca');
    }
}