function removeToast(toast) {
    toast.classList.add("hide");
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    setTimeout(() => toast.remove(), 500);
}
export function showToast(message, type) {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<div class="column ">
                       
            <i class="text-white ${type === 'success' ? 'ri-checkbox-circle-fill' : type === 'error' ? 'ri-error-warning-fill' : 'fa-solid fa-triangle-exclamation'}"></i>
                         <span>${message}</span>
                      </div>
                      <i id="removeTOast" class="fa-solid fa-xmark"></i>`;
    document.querySelector("#toastContainer").appendChild(toast);
    toast.timeoutId = setTimeout(() => removeToast(toast), 4000);

    // remove toast click on xmark
    toast.querySelector("#removeTOast").addEventListener("click", () => removeToast(toast));

}