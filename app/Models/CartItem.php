<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CartItem extends Model
{
    protected $table = 'cart_items'; 
    protected $primaryKey = 'cart_item_id'; 
    public $timestamps = true;

    protected $fillable = [
        'cart_id',
        'buku_id',
        'jumlah',
    ];

    public function cart()
    {
        return $this->belongsTo(Cart::class, 'cart_id', 'cart_id');
    }
    public function buku()
    {
        return $this->belongsTo(Buku::class, 'buku_id', 'buku_id');
    }
}
