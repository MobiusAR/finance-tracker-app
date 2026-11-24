"use client";

import { useEffect } from "react";

export function PwaRegistry() {
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        const onControllerChange = () => {
            // Reload once when a new worker takes control so a home-screen
            // app picks up the new assets instead of keeping the old JS heap.
            if (sessionStorage.getItem("sw-reloaded") === "1") return;
            sessionStorage.setItem("sw-reloaded", "1");
            window.location.reload();
        };
        navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

        const register = async () => {
            try {
                const registration = await navigator.serviceWorker.register("/sw.js");
                const askWaiting = (worker: ServiceWorker | null) => {
                    worker?.postMessage({ type: "SKIP_WAITING" });
                };
                askWaiting(registration.waiting);
                registration.addEventListener("updatefound", () => {
                    const installing = registration.installing;
                    installing?.addEventListener("statechange", () => {
                        if (installing.state === "installed" && navigator.serviceWorker.controller) {
                            askWaiting(installing);
                        }
                    });
                });
                await registration.update();
            } catch (err) {
                console.log("Service Worker registration failed: ", err);
            }
        };

        if (document.readyState === "complete") {
            void register();
        } else {
            window.addEventListener("load", () => void register(), { once: true });
        }

        return () => {
            navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
        };
    }, []);

    return null;
}
