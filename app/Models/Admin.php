<?php

namespace App\Models;

use App\Models\Buku;
use App\Models\Transaksi;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Model;

class Admin extends Model
{
    use HasApiTokens; 
    protected $table = 'admin';
    protected $primaryKey = 'admin_id';
    public $timestamps = true;
    protected $fillable = [
        'name',
        'email',
        'password',
    ];
    protected $hidden = ['password', 'remember_token'];

    public function buku()
    {
        return $this->hasMany(Buku::class, 'admin_id', 'admin_id');
    }
    public function transaksi()
    {
        return $this->hasMany(Transaksi::class, 'admin_id_proses', 'admin_id');
    }
}
