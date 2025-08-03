function removeToast(toast) {
    toast.classList.add("hide");
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    setTimeout(() => toast.remove(), 500);
}

function getIcon(type) {
    const opt = {
        success: 'ri-checkbox-circle-fill',
        error: 'ri-error-warning-fill',
        warn: 'fa-solid fa-triangle-exclamation',
        alarm: 'fas fa-bell',
    }
    return opt[type];
}

export function showToast(message, type) {
    const toast = document.createElement("div");
    toast.className = `toast z-50 backdrop-blur-md bg-card ${type}`;
    toast.innerHTML = `<div class="column text-dark">
                       
            <i class="text-dark ${getIcon(type)}"></i>
                         <span>${message}</span>
                      </div>
                      <i id="removeTOast" class="fa-solid fa-xmark text-gray cursor-pointer"></i>`;
    document.querySelector("#toastContainer").appendChild(toast);
    if (type !== 'alarm') {
        toast.timeoutId = setTimeout(() => removeToast(toast), 4000);
    }

    // remove toast click on xmark
    toast.querySelector("#removeTOast").addEventListener("click", () => removeToast(toast));

}