# Page snapshot

```yaml
- generic [ref=e3]:
  - heading "Sapphire - SQLite Database Demo" [level=1] [ref=e4]
  - generic [ref=e5]:
    - tablist [ref=e6]:
      - tab "Users" [active] [selected] [ref=e7] [cursor=pointer]:
        - generic [ref=e8] [cursor=pointer]: Users
      - tab "Notes" [ref=e9] [cursor=pointer]:
        - generic [ref=e10] [cursor=pointer]: Notes
    - tabpanel "Users" [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]:
          - heading "Add New Sample User" [level=3] [ref=e14]
          - generic [ref=e16]:
            - textbox "Name" [ref=e19]
            - textbox "Email" [ref=e22]
            - button "Add Sample User" [ref=e24] [cursor=pointer]:
              - generic [ref=e26] [cursor=pointer]: Add Sample User
        - generic [ref=e27]:
          - heading "Sample Users (0)" [level=3] [ref=e28]
          - paragraph [ref=e29]: No users yet. Add one above!
```