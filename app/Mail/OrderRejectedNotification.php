<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OrderRejectedNotification extends Mailable
{
    use Queueable, SerializesModels;

    public $transaksi;
    public $user;

    public function __construct($transaksi, $user)
    {
        $this->transaksi = $transaksi;
        $this->user = $user;
    }

    public function build()
    {
        return $this->subject('Pesanan Anda Ditolak - Lobaca')
                    ->view('emails.order_rejected');
    }
}