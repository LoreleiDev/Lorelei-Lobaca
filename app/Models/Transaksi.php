<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaksi extends Model
{
    use HasFactory;

    protected $table = 'transaksi';
    protected $primaryKey = 'transaksi_id';
    public $timestamps = true;

    protected $fillable = [
        'user_id',
        'total_harga',
        'total_berat',
        'alamat_pengiriman',
        'kurir',
        'ongkir',
        'status_transaksi',
        'snap_token',
        'transaction_id_midtrans',
        'admin_action_status',
        'admin_id_proses',
        'resi_pengiriman',
        'tanggal_dikirim',
        'tanggal_diterima',
        'payment_method',
    ];

    protected $casts = [
        'total_harga' => 'decimal:2',
        'ongkir' => 'decimal:2',
    ];


    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function transaksiDetail()
    {
        return $this->hasMany(\App\Models\TransaksiDetail::class, 'transaksi_id');
    }

    public function getPaymentStatusAttribute()
    {

        return $this->attributes['payment_status'] ?? null;
    }

    public function setPaymentStatusAttribute($value)
    {
        $this->attributes['payment_status'] = $value;
    }
}