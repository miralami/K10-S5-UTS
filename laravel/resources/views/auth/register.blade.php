<form action="{{ route('register') }}" method="POST">
    @csrf
    <div>
        <label for="name">Nama</label>
        <input type="text" name="name" id="name" value="{{ old('name') }}" required>
    </div>
    <div>
        <label for="email">Email</label>
        <input type="email" name="email" id="email" value="{{ old('email') }}" required>
    </div>
    <div>
        <label for="password">Password</label>
        <input type="password" name="password" id="password" required>
    </div>
    <div>
        <label for="password_confirmation">Konfirmasi Password</label>
        <input type="password" name="password_confirmation" id="password_confirmation" required>
    </div>
    <button type="submit">Register</button>
    <a href="{{ route('login') }}">Login</a>
</form>
