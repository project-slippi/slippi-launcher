# Contributing to Slippi Launcher

Thank you for your interest in contributing to the Slippi Launcher! This document provides guidelines and information for contributors.

## Adding Translations

The Slippi Launcher uses i18next with the [i18next-auto-keys](https://www.npmjs.com/package/i18next-auto-keys) package for its translations system. This approach provides several benefits over traditional React i18n libraries.

### Benefits Over react-i18next

1. **No Component Pollution**: Doesn't require wrapping components with translation providers or importing translation hooks throughout the codebase. The developer doesn't even need to know what the translation system under the hood is.
2. **Colocated Messages**: Text strings live next to the components that use them.
3. **Automatic Key Generation**: No need to manually manage translation keys - they're generated automatically from your message functions.
4. **Typesafe by default**: Since you're never working directly with the translation key strings.


You can read more about [i18next-auto-keys](https://www.npmjs.com/package/i18next-auto-keys) on the NPM page.


### How Translations Work

The translation system works through a multi-step process:

1. **Message Definition**: Developers define translatable strings in `.messages.ts` files
2. **Build-Time Transformation**: Webpack transforms these message calls into `i18next.t()` calls during build
3. **PO File Management**: Standard `.po` files are used for translations (compatible with most translation tools)
4. **JSON Conversion**: At build time, PO files are converted to JSON format that i18next can consume

### Supported Languages

Currently supported languages:
- `en` - English (default)
- `es` - Spanish (Español)
- `ja` - Japanese (日本語)

### Checking Translation Status

You can see what the translation progress is across the different languages with the following command:

```bash
yarn run i18n:status
```

### Translation Workflow

#### 1. Adding New Translatable Text

When adding new UI text that should be translated, create or update a `.messages.ts` file:

```typescript
// src/renderer/pages/example/example.messages.ts
export const ExampleMessages = {
  welcomeTitle: () => "Welcome to Slippi!",
  userGreeting: (name: string) => `Hello, {0}!`,
  itemCount: (count: number) => `You have {0, plural, one {# item} other {# items}}`,
};
```

Then use these messages in your React components:

```typescript
// src/renderer/pages/example/example.tsx
import React from "react";
import { ExampleMessages as Messages } from "./example.messages";

export const ExampleComponent = ({ userName, items }: Props) => {
  return (
    <div>
      <h1>{Messages.welcomeTitle()}</h1>
      <p>{Messages.userGreeting(userName)}</p>
      <span>{Messages.itemCount(items.length)}</span>
    </div>
  );
};
```

#### 2. Extract Translation Keys

After adding new messages, extract them to update the translation template:

```bash
yarn run i18n:extract
```

This command:
- Scans all `.messages.ts` files in `src/renderer/`
- Extracts translatable strings
- Updates the `locales/messages.pot` template file

#### 3. Sync the Translation Files

```bash
yarn run i18n:sync
```

This command:
- Syncs `locales/es.po`, `locales/ja.po`, etc.
- Adds new untranslated strings (marked as empty `msgstr ""`)
- Preserves existing translations
- Removes old unusued strings

#### 4. Add Translations

Edit the `.po` files directly or use a PO editor (like Poedit) to add translations:

```po
# locales/es.po
msgid "Welcome to Slippi!"
msgstr "¡Bienvenido a Slippi!"

msgid "Hello, {0}!"
msgstr "¡Hola, {0}!"
```

#### 5. Convert to JSON (Optional)

Convert the `.po` files to JSON format for the application:

```bash
yarn run i18n:convert
```

This command:
- Converts all `.po` files to JSON
- Outputs to `release/app/dist/renderer/i18n/`
- Creates `en.json`, `es.json`, `ja.json`, etc.

You only need to manually run this when testing translations in develop mode.
The JSON files are automatically built from the `.po` files in production at package time.

### Adding a New Language

To add support for a new language:

1. **Add Language Option**:
   ```typescript
   // src/renderer/services/i18n/util.ts
   export const SUPPORTED_LANGUAGES = [
     { value: "en", label: "English" },
     { value: "es", label: "Español" },
     { value: "ja", label: "日本語" },
     { value: "fr", label: "Français" }, // Add new language
   ];
   ```

2. **Create PO File**:
   ```bash
   # Create new PO file
   cp locales/messages.pot locales/fr.po
   # Edit the header to set the language
   ```

3. **Run Translation Workflow**: Extract, sync, and convert as described above

### Message File Best Practices

1. **File Naming**: Use `.messages.ts` suffix for message files
2. **Export Pattern**: Export a single object with descriptive method names
3. **Function Calls**: Always use functions (even for simple strings) to maintain consistency
4. **Use ICU MessageFormat**: Use ICU syntax for plurals and interpolation instead of JavaScript string templates
5. **No Template Literals**: Avoid `${}` string interpolation - use ICU placeholders like `{0}`, `{1}` instead
6. **Grouping**: Keep related messages in the same file, typically alongside the components that use them

### ICU MessageFormat Guidelines

The project uses ICU MessageFormat for advanced translation features. This is crucial for proper internationalization:

**✅ Correct Usage:**
```typescript
export const UserProfileMessages = {
  // Simple messages
  profileTitle: () => "User Profile",
  editButton: () => "Edit Profile",

  // Parameterized messages (ICU format)
  welcomeMessage: (name: string) => "Welcome back, {0}!",
  lastSeen: (date: string) => "Last seen: {0}",

  // Pluralization (ICU format)
  itemCount: (count: number) => "{0, plural, one {# item} other {# items}}",
  friendCount: (count: number) => "{0, plural, zero {No friends} one {1 friend} other {# friends}}",

  // Status messages
  loading: () => "Loading profile...",
  error: () => "Failed to load profile. Please try again.",
};
```

**❌ Avoid These Patterns:**
```typescript
// DON'T use template literals with ${}
welcomeMessage: (name: string) => `Welcome back, ${name}!`, // ❌
itemCount: (count: number) => `You have ${count} items`, // ❌

// DON'T use JavaScript logic for plurals
friendCount: (count: number) => count === 1 ? "1 friend" : `${count} friends`, // ❌
```

### ICU Placeholder Types

The project uses **indexed arguments** (`argMode: "indexed"`):

- **Simple interpolation**: `{0}`, `{1}`, `{2}` for the 1st, 2nd, 3rd parameters
- **Plurals**: `{0, plural, one {# item} other {# items}}`
- **Numbers**: `{0, number}` or `{0, number, currency}`
- **Dates**: `{0, date}` or `{0, date, short}`

Example of complex ICU usage:
```typescript
export const ShopMessages = {
  purchaseComplete: (userName: string, itemCount: number, total: number) =>
    "Hello {0}! You bought {1, plural, one {# item} other {# items}} for {2, number, currency}.",
};
```

### Excluding Messages from Translation

Use JSDoc comments to exclude specific functions:

```typescript
export const Messages = {
  // This will be translated
  translate: (): string => "Translate me",

  /** @noTranslate */
  doNotTranslate: (): string => "Keep as-is",

  /**
   * @noTranslate
   * This is a debug message that shouldn't be translated
   */
  debugInfo: (): string => "Debug: Component mounted"
};
```

### Translation Context for Message Disambiguation

Use `@translationContext` in JSDoc comments to provide context for identical strings that may need different translations:

```typescript
export const Messages = {
  /**
   * Play button for games
   * @translationContext gaming
   */
  playGame: (): string => "Play",

  /**
   * Play button for music
   * @translationContext music
   */
  playMusic: (): string => "Play",
};
```

This helps translators distinguish between contexts. For example, in Spanish:
- Gaming context: "Jugar" (to play a game)
- Music context: "Reproducir" (to play music)

**Generated POT file with context:**
```po
#. Play button for games
msgctxt "gaming"
msgid "Play"
msgstr ""

#. Play button for music
msgctxt "music"
msgid "Play"
msgstr ""
```


### Contributing Translations

When contributing translations:

1. **Fork the Repository**: Create your own fork to work in
2. **Create Feature Branch**: `git checkout -b add-french-translations`
3. **Follow Workflow**: Use the yarn scripts to properly extract and sync translations
4. **Test Thoroughly**: Verify translations work in the application
5. **Submit PR**: Include both `.po` file changes and any necessary code changes
6. **Provide Context**: In your PR description, explain any translation choices or cultural considerations

### Debugging Translation Issues

Common issues and solutions:

1. **Messages Not Updating**: Run the full i18n workflow and restart the dev server
2. **Missing Keys**: Check that the message file follows the correct export pattern
3. **Build Errors**: Ensure all `.messages.ts` files export valid JavaScript functions
