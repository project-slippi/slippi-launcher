# Contributing to Slippi Launcher

Thank you for your interest in contributing to the Slippi Launcher! This document provides guidelines and information for contributors.

## Adding Translations

The Slippi Launcher uses a custom internationalization (i18n) system built on top of `i18next` with the `i18next-auto-keys` package. This approach provides several benefits over traditional React i18n libraries.

### Benefits Over react-i18next

1. **No Component Pollution**: Unlike `react-i18next`, our system doesn't require wrapping components with translation providers or importing translation hooks throughout the codebase
2. **Build-Time Optimization**: Messages are transformed at build time, resulting in better performance and smaller bundle sizes
3. **Cleaner Code**: Components remain focused on their logic without translation concerns scattered throughout
4. **Automatic Key Generation**: No need to manually manage translation keys - they're generated automatically from your message functions

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
npm run i18n:extract
```

This command:
- Scans all `.messages.ts` files in `src/renderer/`
- Extracts translatable strings
- Updates the `locales/messages.pot` template file

#### 3. Update Translation Files

Update the `.po` files for all languages with the new strings:

```bash
npm run i18n:update
```

This command:
- Updates `locales/es.po`, `locales/ja.po`, etc.
- Adds new untranslated strings (marked as empty `msgstr ""`)
- Preserves existing translations

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
npm run i18n:convert
```

This command:
- Converts all `.po` files to JSON
- Outputs to `release/app/dist/renderer/i18n/`
- Creates `en.json`, `es.json`, `ja.json`, etc.

You only need to manually run this when testing translations in develop mode.
The JSON files are automatically built from the `.po` files in production at package time.

### Adding a New Language

To add support for a new language:

1. **Update Type Definitions**:
   ```typescript
   // src/renderer/services/i18n/types.ts
   export type Language = "en" | "es" | "ja" | "fr"; // Add new language code
   ```

2. **Add Language Option**:
   ```typescript
   // src/renderer/services/i18n/i18n.service.ts
   const SUPPORTED_LANGUAGES: LanguageOption[] = [
     { value: "en", label: "English" },
     { value: "es", label: "Español" },
     { value: "ja", label: "日本語" },
     { value: "fr", label: "Français" }, // Add new language
   ];
   ```

3. **Create PO File**:
   ```bash
   # Create new PO file
   cp locales/messages.pot locales/fr.po
   # Edit the header to set the language
   ```

4. **Run Translation Workflow**: Extract, update, and convert as described above

### Message File Best Practices

1. **File Naming**: Use `.messages.ts` suffix for message files
2. **Export Pattern**: Export a single object with descriptive method names
3. **Function Calls**: Always use functions (even for simple strings) to maintain consistency
4. **Parameterization**: Use parameters for dynamic content instead of string concatenation
5. **Grouping**: Keep related messages in the same file, typically alongside the components that use them

Example of good message organization:
```typescript
export const UserProfileMessages = {
  // Simple messages
  profileTitle: () => "User Profile",
  editButton: () => "Edit Profile",
  
  // Parameterized messages
  welcomeMessage: (name: string) => `Welcome back, {0}!`,
  lastSeen: (date: string) => `Last seen: {0}`,
  
  // Status messages
  loading: () => "Loading profile...",
  error: () => "Failed to load profile. Please try again.",
};
```

### Contributing Translations

When contributing translations:

1. **Fork the Repository**: Create your own fork to work in
2. **Create Feature Branch**: `git checkout -b add-french-translations`
3. **Follow Workflow**: Use the npm scripts to properly extract and update translations
4. **Test Thoroughly**: Verify translations work in the application
5. **Submit PR**: Include both `.po` file changes and any necessary code changes
6. **Provide Context**: In your PR description, explain any translation choices or cultural considerations

### Debugging Translation Issues

Common issues and solutions:

1. **Messages Not Updating**: Run the full i18n workflow and restart the dev server
2. **Missing Keys**: Check that the message file follows the correct export pattern
3. **Build Errors**: Ensure all `.messages.ts` files export valid JavaScript functions
