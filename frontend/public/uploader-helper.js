/**
 * Amplimentor Interactive Reusable Drag & Drop Uploader Helper
 */

class ReusableUploader {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.options = Object.assign({
            accept: '*/*',
            maxSizeMb: 5,
            onUploadSuccess: (file, response) => {
                if (window.toast) window.toast.success("Upload Completed", `${file.name} uploaded successfully.`);
            },
            onUploadError: (file, error) => {
                if (window.toast) window.toast.error("Upload Failed", error);
            }
        }, options);

        this.init();
    }

    init() {
        this.container.classList.add('reusable-uploader-card');
        this.container.innerHTML = `
            <div class="uploader-inner-content">
                <i class="fa-solid fa-file-arrow-up" style="font-size: 32px; color: var(--primary); margin-bottom: 8px;"></i>
                <div style="font-size: 13.5px; font-weight: 700; color: #1E293B;">Drag & Drop files here, or <span style="color: var(--primary); text-decoration: underline;">browse</span></div>
                <div style="font-size: 11px; color: #64748B; margin-top: 4px;">Supports PDF, PNG, JPG, Docx up to ${this.options.maxSizeMb}MB</div>
            </div>
            <input type="file" class="uploader-file-input" style="display:none;" accept="${this.options.accept}">
            
            <div class="upload-progress-container" style="display: none; width: 100%; height: 6px; background: #E2E8F0; border-radius: 4px; overflow: hidden; margin-top: 12px;">
                <div class="upload-progress-inner" style="width: 0%; height: 100%; background: var(--primary); transition: width 0.1s;"></div>
            </div>
            <div class="upload-status-lbl" style="font-size: 12px; font-weight: 600; margin-top: 6px; color: var(--primary); display: none;">0% Uploaded</div>
            
            <div class="file-preview-block" style="display: none; margin-top: 12px; padding: 12px; border: 1px solid #E2E8F0; border-radius: 8px; background: #FFFFFF; align-items: center; justify-content: space-between; text-align: left;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fa-solid fa-file-pdf" id="previewFileIcon" style="font-size: 24px; color: #EF4444;"></i>
                    <div>
                        <div id="previewFileName" style="font-size: 13px; font-weight: 700; color: #1E293B; width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">document.pdf</div>
                        <div id="previewFileSize" style="font-size: 11px; color: #64748B;">1.2 MB</div>
                    </div>
                </div>
                <button class="btn-toast-dismiss" type="button" onclick="event.stopPropagation(); window.activeUploader.reset()"><i class="fa-solid fa-trash-can" style="color: #EF4444;"></i></button>
            </div>
        `;

        const fileInput = this.container.querySelector('.uploader-file-input');

        this.container.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelected(e.target.files[0]);
            }
        });

        // Drag events
        this.container.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.container.style.borderColor = 'var(--primary)';
        });
        this.container.addEventListener('dragleave', () => {
            this.container.style.borderColor = '#E2E8F0';
        });
        this.container.addEventListener('drop', (e) => {
            e.preventDefault();
            this.container.style.borderColor = '#E2E8F0';
            if (e.dataTransfer.files.length > 0) {
                this.handleFileSelected(e.dataTransfer.files[0]);
            }
        });

        window.activeUploader = this;
    }

    handleFileSelected(file) {
        if (file.size > this.options.maxSizeMb * 1024 * 1024) {
            this.options.onUploadError(file, `File size exceeds the ${this.options.maxSizeMb}MB maximum limit.`);
            return;
        }

        // Hide inner text, show progress bar
        const innerContent = this.container.querySelector('.uploader-inner-content');
        const progressContainer = this.container.querySelector('.upload-progress-container');
        const progressInner = this.container.querySelector('.upload-progress-inner');
        const statusLabel = this.container.querySelector('.upload-status-lbl');

        innerContent.style.display = 'none';
        progressContainer.style.display = 'block';
        statusLabel.style.display = 'block';

        let percent = 0;
        const interval = setInterval(() => {
            percent += 10;
            progressInner.style.width = `${percent}%`;
            statusLabel.textContent = `${percent}% Uploaded`;

            if (percent >= 100) {
                clearInterval(interval);
                progressContainer.style.display = 'none';
                statusLabel.style.display = 'none';
                this.showPreview(file);
                this.options.onUploadSuccess(file, { success: true });
            }
        }, 150);
    }

    showPreview(file) {
        const previewBlock = this.container.querySelector('.file-preview-block');
        const previewName = this.container.querySelector('#previewFileName');
        const previewSize = this.container.querySelector('#previewFileSize');
        const previewIcon = this.container.querySelector('#previewFileIcon');

        previewName.textContent = file.name;
        previewSize.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

        // Update icon based on extension
        const ext = file.name.split('.').pop().toLowerCase();
        if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) {
            previewIcon.className = 'fa-solid fa-file-image';
            previewIcon.style.color = '#3B82F6';
        } else if (ext === 'pdf') {
            previewIcon.className = 'fa-solid fa-file-pdf';
            previewIcon.style.color = '#EF4444';
        } else {
            previewIcon.className = 'fa-solid fa-file-lines';
            previewIcon.style.color = '#64748B';
        }

        previewBlock.style.display = 'flex';
    }

    reset() {
        const innerContent = this.container.querySelector('.uploader-inner-content');
        const progressContainer = this.container.querySelector('.upload-progress-container');
        const statusLabel = this.container.querySelector('.upload-status-lbl');
        const previewBlock = this.container.querySelector('.file-preview-block');
        const fileInput = this.container.querySelector('.uploader-file-input');

        fileInput.value = '';
        innerContent.style.display = 'block';
        progressContainer.style.display = 'none';
        statusLabel.style.display = 'none';
        previewBlock.style.display = 'none';
    }
}
