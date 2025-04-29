// ========================
// File: views/Profile.ts
// ========================

import AbstractView from '../../utils/AbstractView.js';

export default class UserManagement extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
		this.setTitle('Transcendence - Home');
	}

	async getHtml() {
		document.getElementById('header-root')!.className = 'shadow-lg p-8 bg-gradient-to-r from-indigo-900/80 via-blue-900/80 to-sky-900/80 text-white backdrop-blur-md';
		document.getElementById('footer-root')!.className = 'py-4 px-6 w-full bg-gradient-to-r from-indigo-900/80 via-blue-900/80 to-sky-900/80 text-white backdrop-blur-md';

		return this.render(`
			<div class="max-w-4xl mx-auto p-6 space-y-8">
				<h1 class="text-3xl font-bold text-center text-white">User Management</h1>
				<!-- === BACKEND TESTING START === -->
                <div class="">
                    <div class="card rounded-2xl bg-gray-800">
                        <div class="card-body space-y-4">
                            <h2 class="card-title text-white">Read One User</h2>
                            <form id="read-one-form" class="space-y-2">
                                <input type="number" id="user-id" placeholder="User ID" required class="w-full p-2 rounded" />
                                <button type="submit" class="btn btn-primary w-full">Read User</button>
                                <div id="read-result" class="text-white text-sm pt-2"></div>
                            </form>
                        </div>
                    </div>
                </div>
				<!-- === BACKEND TESTING END === -->
			</div>
			<script type="module" src="/dist/frontend/services/user_management.js"></script>
		`, {});
	}
}

/*

			<div class="max-w-4xl mx-auto p-6 space-y-8">
				<h1 class="text-3xl font-bold text-center text-white">User Management</h1>
				<!-- === BACKEND TESTING START === -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">

					<!-- CREATE -->
					<div class="card rounded-2xl bg-gray-800">
						<div class="card-body space-y-4">
							<h2 class="card-title text-white">Create User</h2>
							<form id="create-form" class="space-y-2">
								<input type="text" id="create-name" placeholder="Name" required class="w-full p-2 rounded" />
								<input type="text" id="create-username" placeholder="Username" required class="w-full p-2 rounded" />
								<button type="submit" class="btn btn-primary w-full">Create</button>
							</form>
						</div>
					</div>

					<!-- READ ONE -->
					<div class="card rounded-2xl bg-gray-800">
						<div class="card-body space-y-4">
							<h2 class="card-title text-white">Read One User</h2>
							<form id="read-one-form" class="space-y-2">
								<input type="number" id="user-id" placeholder="User ID" required class="w-full p-2 rounded" />
								<button type="submit" class="btn btn-primary w-full">Read User</button>
								<div id="read-result" class="text-white text-sm pt-2"></div>
							</form>
						</div>
					</div>

					<!-- UPDATE -->
					<div class="card rounded-2xl bg-gray-800">
						<div class="card-body space-y-4">
							<h2 class="card-title text-white">Update User</h2>
							<form id="update-form" class="space-y-2">
								<input type="number" id="update-id" placeholder="User ID" required class="w-full p-2 rounded" />
								<input type="text" id="update-name" placeholder="New Name" required class="w-full p-2 rounded" />
								<input type="text" id="update-username" placeholder="New Username" required class="w-full p-2 rounded" />
								<button type="submit" class="btn btn-primary w-full">Update</button>
							</form>
						</div>
					</div>

					<!-- DELETE -->
					<div class="card rounded-2xl bg-gray-800">
						<div class="card-body space-y-4">
							<h2 class="card-title text-white">Delete User</h2>
							<form id="delete-form" class="space-y-2">
								<input type="number" id="delete-id" placeholder="User ID" required class="w-full p-2 rounded" />
								<button type="submit" class="btn btn-danger w-full">Delete</button>
							</form>
						</div>
					</div>

					<!-- READ ALL -->
					<div class="card col-span-full rounded-2xl bg-gray-800">
						<div class="card-body space-y-4 text-center">
							<h2 class="card-title text-white">Read All Users</h2>
							<button id="read-all" class="btn btn-secondary">Read all Users</button>
							<ul id="user-list" class="text-white text-sm pt-2 space-y-1"></ul>
						</div>
					</div>

				</div>
				<!-- === BACKEND TESTING END === -->
			</div>
			<script type="module" src="/dist/frontend/services/user_management.js"></script>


*/