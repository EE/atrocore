{{#if isNotEmpty}}
<span class="label colored-enum" style="color:{{color}};background-color:{{backgroundColor}};font-size:{{fontSize}};font-weight:{{fontWeight}};border:{{border}}">
    {{translateOption value scope=scope field=name translatedOptions=translatedOptions}}
</span>
{{else}}
{{translate 'None'}}
{{/if}}
