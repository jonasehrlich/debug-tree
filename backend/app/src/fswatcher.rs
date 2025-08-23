use notify::{RecursiveMode, Watcher};
use notify_debouncer_mini::{DebouncedEvent, Debouncer, new_debouncer};
use std::{sync::mpsc, time::Duration};

/// Create a debouncer and return (debouncer, rx).
/// Caller is responsible for running the blocking loop (e.g. in spawn_blocking).
pub fn setup_watchers<P: AsRef<std::path::Path>>(
    paths: &[P],
    delay: Duration,
) -> (Debouncer<impl Watcher>, mpsc::Receiver<Vec<DebouncedEvent>>) {
    let (tx, rx) = mpsc::channel();

    let mut debouncer = new_debouncer(
        delay,
        move |res: Result<Vec<DebouncedEvent>, notify::Error>| match res {
            Ok(evs) => {
                log::info!("Changes detected in watched paths");
                let _ = tx.send(evs);
            }
            Err(e) => {
                log::warn!("received notify error: {e:?}");
            }
        },
    )
    .expect("failed to create debouncer");

    // Register all paths
    for path in paths {
        if let Err(e) = debouncer
            .watcher()
            .watch(path.as_ref(), RecursiveMode::Recursive)
        {
            eprintln!("watch error for {:?}: {:?}", path.as_ref(), e);
        }
    }

    (debouncer, rx)
}
