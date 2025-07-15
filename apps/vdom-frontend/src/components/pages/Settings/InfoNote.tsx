interface InfoNoteProps {
  readonly message: string;
}

export function InfoNote({ message }: InfoNoteProps) {
  return (
    <div class="oj-panel oj-panel-shadow-sm oj-sm-margin-4x-top oj-sm-padding-4x" 
         style="background: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 6px;">
      <div class="oj-flex oj-sm-align-items-flex-start" style="gap: 8px;">
        <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-center" 
             style="width: 16px; height: 16px; margin-top: 2px;">
        </div>
        <div>
          <p class="oj-typography-body-sm" style="margin: 0; color: #0c4a6e; line-height: 1.4;">
            <strong>Note:</strong> {message}
          </p>
        </div>
      </div>
    </div>
  );
}
