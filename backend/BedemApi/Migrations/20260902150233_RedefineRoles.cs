using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BedemApi.Migrations
{
    /// <summary>
    /// "User" was the only non-staff role and meant two different things at once:
    /// somebody who signed up on the site, and somebody the organisation admitted.
    /// Those split into Visitor and Member. Every existing account came from public
    /// registration, so all of them become Visitors; an admin promotes the real
    /// members by hand afterwards.
    /// </summary>
    public partial class RedefineRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Role",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "Visitor",
                oldClrType: typeof(string),
                oldType: "text",
                oldDefaultValue: "User");

            // The new default only covers rows written from here on.
            migrationBuilder.Sql(@"UPDATE ""Users"" SET ""Role"" = 'Visitor' WHERE ""Role"" = 'User';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Members fold back into the old catch-all role, which is the best
            // the old set of three can express.
            migrationBuilder.Sql(
                @"UPDATE ""Users"" SET ""Role"" = 'User' WHERE ""Role"" IN ('Visitor', 'Member', 'Finance', 'Assembly');");

            migrationBuilder.AlterColumn<string>(
                name: "Role",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "User",
                oldClrType: typeof(string),
                oldType: "text",
                oldDefaultValue: "Visitor");
        }
    }
}
