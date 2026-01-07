<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        
        Schema::create('carts', function (Blueprint $table) {
            $table->id('cart_id'); // Primary key
            $table->foreignId('user_id')->constrained('users', 'id')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('cart_items', function (Blueprint $table) {
            $table->id('cart_item_id'); // Primary key
            $table->foreignId('cart_id')->constrained('carts', 'cart_id')->onDelete('cascade');
            $table->foreignId('buku_id')->constrained('buku', 'buku_id')->onDelete('cascade');
            $table->integer('jumlah')->default(1);
            $table->timestamps();
        });

        
        Schema::create('transaksi', function (Blueprint $table) {
            $table->bigIncrements('transaksi_id');
            $table->unsignedBigInteger('user_id');
            $table->decimal('total_harga', 15, 2);
            $table->integer('total_berat');
            $table->text('alamat_pengiriman');
            $table->string('kurir');
            $table->decimal('ongkir', 10, 2);
            $table->enum('status_transaksi', [
                'transaksi-diproses',
                'transaksi-sukses',
                'pesanan-disiapkan',
                'pesanan-sedang-dikirim',
                'pesanan-telah-diterima',
                'transaksi-ditolak',
                'transaksi-dibatalkan',
                'transaksi-kadaluarsa',
                'pesanan-ditunda'
            ])->default('pesanan-disiapkan');
            $table->string('snap_token')->nullable();
            $table->string('transaction_id_midtrans')->nullable();
            $table->string('resi_pengiriman')->nullable();
            $table->timestamp('tanggal_dikirim')->nullable();
            $table->timestamp('tanggal_diterima')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::create('transaksi_detail', function (Blueprint $table) {
            $table->bigIncrements('transaksi_detail_id');
            $table->unsignedBigInteger('transaksi_id');
            $table->unsignedBigInteger('buku_id');
            $table->integer('jumlah');
            $table->decimal('harga_satuan', 10, 2); 
            $table->timestamps();

            $table->foreign('transaksi_id')->references('transaksi_id')->on('transaksi')->onDelete('cascade');
            $table->foreign('buku_id')->references('buku_id')->on('buku')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        
        //
    }
};