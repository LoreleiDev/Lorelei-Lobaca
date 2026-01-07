<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    protected $table = 'carts'; 
    protected $primaryKey = 'cart_id'; 
    public $timestamps = true;

    protected $fillable = [
        'user_id',
    ];
    
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function items()
    {
        return $this->hasMany(CartItem::class, 'cart_id', 'cart_id');
    }

    public function buku()
{
    return $this->belongsTo(Buku::class, 'buku_id', 'buku_id');
}
}
