<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SendEmailVerificationCode extends Notification
{
    use Queueable;

    public function __construct(
        protected string $code,
        protected string $purpose
    ) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $name = $notifiable instanceof \App\Models\User ? $notifiable->first_name : 'Pengguna';

        return (new MailMessage)
            ->subject('Kode Verifikasi - ' . ucfirst($this->purpose))
            ->greeting("Halo, {$name}!")
            ->line("Gunakan kode berikut untuk {$this->purpose}:")
            ->line($this->code)
            ->line('Kode ini berlaku selama 5 menit.')
            ->salutation('Salam, Tim Lobaca');
    }
}