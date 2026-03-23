mod apps;
mod backup;
mod connections;
mod credentials;
mod db;
mod settings;
mod ssh;
mod tabs;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            db::init_db(app.handle())?;
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_zoom(0.9);
                if let Some(icon) = app.default_window_icon().cloned() {
                    let _ = window.set_icon(icon);
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            connections::get_connections,
            connections::save_connection,
            connections::update_connection,
            connections::delete_connection,
            connections::launch_rdp,
            apps::get_apps,
            apps::save_app,
            apps::update_app,
            apps::delete_app,
            apps::launch_app,
            credentials::get_creds_list,
            credentials::save_cred,
            credentials::delete_cred,
            credentials::list_stored_credentials,
            credentials::create_stored_credential,
            credentials::update_stored_credential,
            credentials::delete_stored_credential,
            backup::export_data,
            backup::import_data,
            ssh::get_ssh_connections,
            ssh::save_ssh_connection,
            ssh::update_ssh_connection,
            ssh::delete_ssh_connection,
            ssh::launch_ssh,
            settings::get_setting,
            settings::save_setting,
            tabs::get_tabs,
            tabs::create_tab,
            tabs::update_tab,
            tabs::delete_tab,
            tabs::assign_to_tab,
            tabs::remove_from_tab,
            tabs::get_tab_assignments,
            tabs::get_resource_tab_assignments
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
