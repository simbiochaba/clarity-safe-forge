;; SafeForge Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-template-exists (err u101))
(define-constant err-template-not-found (err u102))
(define-constant err-invalid-params (err u103))
(define-constant err-inactive-template (err u104))

;; Data vars
(define-map templates 
  { template-id: uint } 
  { 
    name: (string-ascii 64),
    code: (string-utf8 4096),
    version: uint,
    created-by: principal,
    is-active: bool
  }
)

(define-map deployments
  { deployment-id: uint }
  {
    template-id: uint,
    owner: principal,
    params: (list 10 (string-utf8 256)),
    timestamp: uint
  }
)

(define-data-var template-counter uint u0)
(define-data-var deployment-counter uint u0)

;; Public functions
(define-public (add-template (name (string-ascii 64)) (code (string-utf8 4096)))
  (let ((template-id (+ (var-get template-counter) u1)))
    (if (is-eq tx-sender contract-owner)
      (begin
        (map-set templates 
          { template-id: template-id }
          {
            name: name,
            code: code,
            version: u1,
            created-by: tx-sender,
            is-active: true
          }
        )
        (var-set template-counter template-id)
        (print { type: "template-added", template-id: template-id, name: name })
        (ok template-id))
      err-owner-only)))

(define-public (update-template-status (template-id uint) (active bool))
  (if (is-eq tx-sender contract-owner)
    (match (map-get? templates { template-id: template-id })
      template (begin
        (map-set templates
          { template-id: template-id }
          (merge template { is-active: active })
        )
        (print { type: "template-status-updated", template-id: template-id, active: active })
        (ok true))
      err-template-not-found)
    err-owner-only))

(define-public (deploy-contract 
  (template-id uint) 
  (params (list 10 (string-utf8 256))))
  (let ((deployment-id (+ (var-get deployment-counter) u1)))
    (match (map-get? templates { template-id: template-id })
      template 
      (if (get is-active template)
        (begin
          (map-set deployments
            { deployment-id: deployment-id }
            {
              template-id: template-id,
              owner: tx-sender,
              params: params,
              timestamp: block-height
            }
          )
          (var-set deployment-counter deployment-id)
          (print { type: "contract-deployed", deployment-id: deployment-id, template-id: template-id })
          (ok deployment-id))
        err-inactive-template)
      err-template-not-found)))
      
;; Read only functions
(define-read-only (get-template (template-id uint))
  (map-get? templates { template-id: template-id }))
  
(define-read-only (get-deployment (deployment-id uint))
  (map-get? deployments { deployment-id: deployment-id }))
