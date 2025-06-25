pub fn to_kebab_case(s: &str) -> String {
    s.to_lowercase().replace(' ', "-").replace("_", "-")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_to_kebab_case() {
        assert_eq!(to_kebab_case("Hello World"), "hello-world");
        assert_eq!(to_kebab_case("hello_world"), "hello-world");
        assert_eq!(to_kebab_case("Rust Programming"), "rust-programming");
        assert_eq!(to_kebab_case("Debug Tree CLI"), "debug-tree-cli");
    }
}
