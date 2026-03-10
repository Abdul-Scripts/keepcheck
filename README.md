# KeepCheck

KeepCheck is a local-first PWA for tracking outbound business checks.

It is designed to be installable, usable offline, and private by default:

- check records are stored on-device
- check photos are captured from camera and saved locally
- users can export/import backups without a cloud backend

## Core Features

- Onboarding with user + business profile
- Dashboard KPIs
  - pending checks
  - cleared checks
  - pending amount
- Pending checks monitor with one-tap clear action
- Add new check flow
  - recipient autocomplete (from prior checks)
  - check number suggestion (+1 from latest numeric check)
  - formatted amount/date input
  - camera capture with overlay guide and cropped capture
- Saved checks page
  - edit/delete checks
  - status/date/company/check-number filters
  - image preview modal
- Profile page
  - update profile
  - export backup JSON
  - import backup with replace/merge options
- Bottom navigation (`Home`, `New Check`, `All Checks`, `Profile`)

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- PWA manifest + custom Service Worker (`public/sw.js`)
- Local persistence via `localStorage` + session bootstrap flags

## Local-First Data

KeepCheck stores data in the browser:

- checks: `keepcheck-records`
- profile: `keepcheck-profile`
- bootstrap version: `keepcheck-bootstrap-version`
- launch-ready session flag: `keepcheck-launch-ready`

No backend database is required for core usage.

## Install + Offline Bootstrap Flow

The app enforces an install/bootstrap flow for standalone usage:

1. User installs/open as PWA
2. `/install/` ensures service worker readiness
3. Core routes/assets are cached
4. User is routed into the app

This is handled by:

- [app/install/page.tsx](/Users/abdulwahib/Desktop/keepcheck/app/install/page.tsx)
- [public/sw.js](/Users/abdulwahib/Desktop/keepcheck/public/sw.js)
- [hooks/useKeepCheckApp.ts](/Users/abdulwahib/Desktop/keepcheck/hooks/useKeepCheckApp.ts)

## Routes

- `/` dashboard
- `/new-check/` create check
- `/checks/` saved checks list + edit
- `/profile/` profile + import/export
- `/install/` bootstrap/cache setup
- `/home/` alias redirect to `/`
- `/checks/new/` legacy redirect to `/new-check/`

## Live App

Use the live site to install/download KeepCheck directly:

- [https://keepcheck.vercel.app/](https://keepcheck.vercel.app/)

## Project Structure (High-Level)

- `app/` routes and page shells
- `components/` UI and interaction components
- `hooks/` app state/persistence hook
- `lib/` shared utilities (camera, storage, scroll lock)
- `types/` shared TypeScript models
- `public/` static assets, manifest, service worker

## Current Scope

KeepCheck currently does not perform OCR/auto-fill from check images. That is planned for a future release.
