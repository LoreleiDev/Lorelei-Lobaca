<h1>Notifikasi Transaksi Baru</h1>
<p>Hai Admin,</p>
<p>Ada transaksi baru dengan ID: <strong>{{ $transaksi->transaction_id_midtrans }}</strong></p>
<p>Total: <strong>Rp {{ number_format($transaksi->total_harga, 0, ',', '.') }}</strong></p>
<p>Silakan proses pesanan segera.</p>
<p>Salam,<br>{{ config('app.name') }}</p>